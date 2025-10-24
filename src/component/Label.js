import { fontWeights, textcolors, textSizes } from "../theme";

// Label.js
export default function Label({ children, htmlFor, style = {}, customStyle = '' }) {
  return (
    <label
      htmlFor={htmlFor}
      style={style}
      className={customStyle === '' ?`${textSizes.base} ${textcolors.normaltext} ${fontWeights.semibold} ` : customStyle}
    >
      {children}
    </label>
  );
}
