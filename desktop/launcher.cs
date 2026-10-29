// Entrada portátil Windows. O pacote embutido só é lido/extraído no primeiro uso.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Threading;
using System.Windows.Forms;

internal static class Launcher {
    static readonly Assembly Self = Assembly.GetExecutingAssembly();
    static readonly string Data = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "LittleTec Desktop");

    static string ResourceText(string name) {
        using (var stream = Self.GetManifestResourceStream(name))
        using (var reader = new StreamReader(stream)) return reader.ReadToEnd().Trim();
    }

    static void Log(string message) {
        try {
            Directory.CreateDirectory(Data);
            File.AppendAllText(Path.Combine(Data, "launcher.log"), DateTime.UtcNow.ToString("O") + " " + message + "\r\n");
        } catch (IOException) { } catch (UnauthorizedAccessException) { }
    }

    static bool Ready(string folder, string digest) {
        string marker = Path.Combine(folder, ".ready");
        return File.Exists(marker) && File.ReadAllText(marker).Trim() == digest
            && File.Exists(Path.Combine(folder, "LittleTec-Studio.exe"))
            && File.Exists(Path.Combine(folder, "resources", "app.asar"))
            && File.Exists(Path.Combine(folder, "resources", "bridge", "LittleTec-Bridge.exe"));
    }

    sealed class Preparation : Form {
        readonly ProgressBar progress;
        public Preparation() {
            Text = "LittleTec Studio";
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false; MinimizeBox = false; ControlBox = false;
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(410, 132);
            BackColor = Color.FromArgb(17, 20, 18);
            using (var stream = Self.GetManifestResourceStream("icon.ico"))
            using (var icon = new Icon(stream)) Icon = (Icon)icon.Clone();
            var picture = new PictureBox { Location = new Point(22, 23), Size = new Size(48, 48), SizeMode = PictureBoxSizeMode.Zoom };
            using (var stream = Self.GetManifestResourceStream("icon.png"))
            using (var image = Image.FromStream(stream)) picture.Image = new Bitmap(image);
            Controls.Add(picture);
            Controls.Add(new Label { Text = "Preparando o LittleTec Studio…", ForeColor = Color.White,
                Font = new Font("Segoe UI", 11), AutoSize = true, Location = new Point(85, 34) });
            progress = new ProgressBar { Location = new Point(22, 92), Size = new Size(366, 14), Maximum = 100 };
            Controls.Add(progress);
            Show(); Application.DoEvents();
        }
        public void Advance(int value) { progress.Value = Math.Min(100, value); Application.DoEvents(); }
    }

    static string Prepare(string digest, out bool cacheHit) {
        string parent = Path.Combine(Data, "builds");
        string target = Path.Combine(parent, digest.Substring(0, 24));
        cacheHit = Ready(target, digest);
        if (cacheHit) return target;
        Directory.CreateDirectory(parent);
        using (var splash = new Preparation())
        using (var mutex = new Mutex(false, @"Local\LittleTecStudioPrepare-" + digest.Substring(0, 24))) {
            bool owned = false;
            var wait = Stopwatch.StartNew();
            try {
                while (!owned) {
                    try { owned = mutex.WaitOne(100); }
                    catch (AbandonedMutexException) { owned = true; }
                    Application.DoEvents();
                    if (wait.Elapsed.TotalMinutes > 3) throw new IOException("Outra abertura ainda está preparando o aplicativo. Tente novamente em instantes.");
                }
                if (Ready(target, digest)) { cacheHit = true; return target; }
                using (var payload = Self.GetManifestResourceStream("payload.zip"))
                using (var hash = SHA256.Create()) {
                    string actual = BitConverter.ToString(hash.ComputeHash(payload)).Replace("-", "").ToLowerInvariant();
                    if (actual != digest) throw new IOException("O pacote interno está incompleto. Baixe novamente o aplicativo.");
                }
                string staging = Path.Combine(parent, "preparing-" + Guid.NewGuid().ToString("N"));
                Directory.CreateDirectory(staging);
                try {
                    using (var payload = Self.GetManifestResourceStream("payload.zip"))
                    using (var archive = new ZipArchive(payload, ZipArchiveMode.Read)) {
                        long total = archive.Entries.Sum(entry => entry.Length), done = 0;
                        foreach (var entry in archive.Entries) {
                            string name = Path.GetFullPath(Path.Combine(staging, entry.FullName));
                            if (!name.StartsWith(staging + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
                                throw new IOException("Caminho inválido no pacote interno.");
                            if (entry.Name.Length == 0) { Directory.CreateDirectory(name); continue; }
                            Directory.CreateDirectory(Path.GetDirectoryName(name));
                            using (var input = entry.Open())
                            using (var output = File.Create(name)) input.CopyTo(output);
                            done += entry.Length;
                            splash.Advance(total > 0 ? (int)(100 * done / total) : 100);
                        }
                    }
                    File.WriteAllText(Path.Combine(staging, ".ready"), digest);
                    if (!Ready(staging, digest)) throw new IOException("A preparação do aplicativo ficou incompleta.");
                    if (Directory.Exists(target)) Directory.Move(target, target + "-incomplete-" + DateTime.UtcNow.Ticks);
                    Directory.Move(staging, target);
                } finally { if (Directory.Exists(staging)) Directory.Delete(staging, true); }
                return target;
            } finally { if (owned) mutex.ReleaseMutex(); }
        }
    }

    [STAThread]
    static int Main(string[] arguments) {
        var timer = Stopwatch.StartNew();
        bool smoke = arguments.Contains("--smoke");
        Application.EnableVisualStyles();
        try {
            string digest = ResourceText("payload.sha256");
            bool cacheHit;
            string folder = Prepare(digest, out cacheHit);
            var start = new ProcessStartInfo(Path.Combine(folder, "LittleTec-Studio.exe")) {
                WorkingDirectory = folder, UseShellExecute = false, CreateNoWindow = true,
                Arguments = String.Join(" ", arguments.Where(a => a == "--smoke" || a == "--smoke-close-window" || a == "--offline"))
            };
            start.EnvironmentVariables.Remove("ELECTRON_RUN_AS_NODE");
            using (var process = Process.Start(start)) {
                Log(String.Format("cache={0} launcher_ms={1} version={2}", cacheHit ? "hit" : "miss", timer.ElapsedMilliseconds, ResourceText("payload.version")));
                if (smoke) {
                    if (!process.WaitForExit(90000)) throw new IOException("A verificação de abertura excedeu o prazo.");
                    return process.ExitCode;
                }
            }
            return 0;
        } catch (Exception error) {
            Log(error.ToString());
            if (!smoke) MessageBox.Show(error.Message, "LittleTec Studio", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}
