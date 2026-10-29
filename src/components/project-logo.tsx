import projectIcon from '../../desktop/icon.png';

export function ProjectLogo({ size = 36 }: { size?: number }) {
  const source = typeof projectIcon === 'string' ? projectIcon : projectIcon.src;
  return <img src={source} width={size} height={size} alt="" aria-hidden="true" />;
}
