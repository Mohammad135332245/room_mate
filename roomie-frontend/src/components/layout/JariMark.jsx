/**
 * The Jari mark: a riad silhouette with a crescent-and-star above a
 * horseshoe arch, and a zellige rosette set into the archway.
 *
 * The white areas are cut-outs, so `cutout` should match whatever sits
 * behind the mark (the shell surface by default).
 */
export default function JariMark({
  size = 36,
  color = 'var(--color-terracotta)',
  accent = 'var(--color-sage)',
  cutout = 'var(--color-shell)',
  className = '',
  title,
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      {/* Riad silhouette: pitched roof, body, and the two base pillars. */}
      <path
        fill={color}
        d="M50 4 80 33v25h12v38H8V58h12V33L50 4Z"
      />

      {/* Notches that detach the pillars from the body. */}
      <rect x="8" y="59.5" width="10" height="3.5" fill={cutout} />
      <rect x="82" y="59.5" width="10" height="3.5" fill={cutout} />

      {/* Crescent: a disc with a second disc punched out of it. */}
      <circle cx="42" cy="30" r="9" fill={cutout} />
      <circle cx="46.5" cy="28" r="7.4" fill={color} />

      {/* Eight-pointed star — two squares, one rotated 45°. */}
      <g fill={cutout} transform="translate(60 28)">
        <rect x="-5.4" y="-5.4" width="10.8" height="10.8" />
        <rect x="-5.4" y="-5.4" width="10.8" height="10.8" transform="rotate(45)" />
      </g>

      {/* Horseshoe archway. */}
      <path fill={cutout} d="M35 96V76a15 15 0 0 1 30 0v20Z" />

      {/* Zellige rosette inside the arch. */}
      <g transform="translate(50 80)">
        {/* Centre star */}
        <g fill={color}>
          <rect x="-5.6" y="-5.6" width="11.2" height="11.2" />
          <rect x="-5.6" y="-5.6" width="11.2" height="11.2" transform="rotate(45)" />
        </g>
        {/* Sage tiles on the diagonals */}
        <g fill={accent}>
          <rect x="-4.6" y="-4.6" width="9.2" height="9.2" transform="translate(-9 -9) rotate(45)" />
          <rect x="-4.6" y="-4.6" width="9.2" height="9.2" transform="translate(9 -9) rotate(45)" />
          <rect x="-4.6" y="-4.6" width="9.2" height="9.2" transform="translate(-9 9) rotate(45)" />
          <rect x="-4.6" y="-4.6" width="9.2" height="9.2" transform="translate(9 9) rotate(45)" />
        </g>
        {/* Terracotta tiles on the cardinals */}
        <g fill={color}>
          <rect x="-3.4" y="-3.4" width="6.8" height="6.8" transform="translate(0 -12) rotate(45)" />
          <rect x="-3.4" y="-3.4" width="6.8" height="6.8" transform="translate(0 12) rotate(45)" />
          <rect x="-3.4" y="-3.4" width="6.8" height="6.8" transform="translate(-12 0) rotate(45)" />
          <rect x="-3.4" y="-3.4" width="6.8" height="6.8" transform="translate(12 0) rotate(45)" />
        </g>
      </g>
    </svg>
  )
}
