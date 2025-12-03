// polyfills.js
if (typeof File === 'undefined') {
  global.File = class File {
    constructor(parts, filename, properties = {}) {
      this.parts = parts;
      this.name = filename;
      Object.assign(this, properties);
    }
  };
}
