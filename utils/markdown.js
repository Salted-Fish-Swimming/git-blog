let NEWLINES_RE  = /\r\n?|\n/g;
let NULL_RE      = /\0/g;

function normalize (content) {
  return content
    .replace(NEWLINES_RE, '\n')
    .replace(NULL_RE, '\uFFFD');
}

/**
 * Document : Block[] 
 * Block : { type, Line[] }
 * Line: { content: [ string, Span, string ] }
 * Span: { content: Line }
 */
class Markdown {
  constructor (src) {
    this.src = src;
    let normal = normalize(src);
    let lines = normal.split('\n');
    this.instance = {
      normal, lines,
    }
  }

  title () {
    if (this.instance.title) {
      return this.instance.title;
    };
    const titleLine = this.instance.lines.find(s => s[0] === '#');
    const title = titleLine.slice(1).trim();
    this.instance.title = title;
    return title;
  }
}

module.exports = {
  parse (markdown) {
    return new Markdown(markdown);
  }
}
