const ImageKit = require('imagekit');
require('dotenv').config();

const imagekit = new ImageKit({
  publicKey: "public_I6881syKXHRetEz0Z8kVTEw+mFY=",
  privateKey: "private_qgBTdYrUxlKQx01Wb5XADXTDvgg=",
  urlEndpoint: "https://ik.imagekit.io/cjdokyuzp"
});

module.exports = imagekit;
