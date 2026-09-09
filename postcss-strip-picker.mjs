/**
 * PostCSS plugin to strip CSS rules containing ::picker(select).
 * daisyUI v5 uses this experimental pseudo-element which Turbopack cannot parse.
 */

const stripPickerPlugin = () => {
  return {
    postcssPlugin: "postcss-strip-picker",
    Rule(rule) {
      if (rule.selector && rule.selector.includes("::picker")) {
        rule.remove();
      }
    },
  };
};

stripPickerPlugin.postcss = true;

export default stripPickerPlugin;
