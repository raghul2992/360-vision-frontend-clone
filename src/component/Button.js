export default function ButtonComponent({
  children,
  onClick,
  style = {},
  className = '',
  type = 'button',
  disabled = false,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      style={style}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  );
}