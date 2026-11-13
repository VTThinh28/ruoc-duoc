/* js-aruco2 2.0.0 (MIT): cv.js và aruco.js, bỏ hai bộ mã có sẵn không dùng tới */
/*
Copyright (c) 2011 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "OpenCV: Open Computer Vision Library"
  http://sourceforge.net/projects/opencvlibrary/
- "Stack Blur: Fast But Goodlooking"
  http://incubator.quasimondo.com/processing/fast_blur_deluxe.php
*/

var CV = CV || {};
this.CV = CV;

CV.Image = function(width, height, data){
  this.width = width || 0;
  this.height = height || 0;
  this.data = data || [];
};

CV.grayscale = function(imageSrc, imageDst){
  var src = imageSrc.data, dst = imageDst.data, len = src.length,
      i = 0, j = 0;

  for (; i < len; i += 4){
    dst[j ++] =
      (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114 + 0.5) & 0xff;
  }

  imageDst.width = imageSrc.width;
  imageDst.height = imageSrc.height;

  return imageDst;
};

CV.threshold = function(imageSrc, imageDst, threshold){
  var src = imageSrc.data, dst = imageDst.data,
      len = src.length, tab = [], i;

  for (i = 0; i < 256; ++ i){
    tab[i] = i <= threshold? 0: 255;
  }

  for (i = 0; i < len; ++ i){
    dst[i] = tab[ src[i] ];
  }

  imageDst.width = imageSrc.width;
  imageDst.height = imageSrc.height;

  return imageDst;
};

CV.adaptiveThreshold = function(imageSrc, imageDst, kernelSize, threshold){
  var src = imageSrc.data, dst = imageDst.data, len = src.length, tab = [], i;

  CV.stackBoxBlur(imageSrc, imageDst, kernelSize);

  for (i = 0; i < 768; ++ i){
    tab[i] = (i - 255 <= -threshold)? 255: 0;
  }

  for (i = 0; i < len; ++ i){
    dst[i] = tab[ src[i] - dst[i] + 255 ];
  }

  imageDst.width = imageSrc.width;
  imageDst.height = imageSrc.height;

  return imageDst;
};

CV.otsu = function(imageSrc){
  var src = imageSrc.data, len = src.length, hist = [],
      threshold = 0, sum = 0, sumB = 0, wB = 0, wF = 0, max = 0,
      mu, between, i;

  for (i = 0; i < 256; ++ i){
    hist[i] = 0;
  }

  for (i = 0; i < len; ++ i){
    hist[ src[i] ] ++;
  }

  for (i = 0; i < 256; ++ i){
    sum += hist[i] * i;
  }

  for (i = 0; i < 256; ++ i){
    wB += hist[i];
    if (0 !== wB){

      wF = len - wB;
      if (0 === wF){
        break;
      }

      sumB += hist[i] * i;

      mu = (sumB / wB) - ( (sum - sumB) / wF );

      between = wB * wF * mu * mu;

      if (between > max){
        max = between;
        threshold = i;
      }
    }
  }

  return threshold;
};

CV.stackBoxBlurMult =
  [1, 171, 205, 293, 57, 373, 79, 137, 241, 27, 391, 357, 41, 19, 283, 265];

CV.stackBoxBlurShift =
  [0, 9, 10, 11, 9, 12, 10, 11, 12, 9, 13, 13, 10, 9, 13, 13];

CV.BlurStack = function(){
  this.color = 0;
  this.next = null;
};

CV.stackBoxBlur = function(imageSrc, imageDst, kernelSize){
  var src = imageSrc.data, dst = imageDst.data,
      height = imageSrc.height, width = imageSrc.width,
      heightMinus1 = height - 1, widthMinus1 = width - 1,
      size = kernelSize + kernelSize + 1, radius = kernelSize + 1,
      mult = CV.stackBoxBlurMult[kernelSize],
      shift = CV.stackBoxBlurShift[kernelSize],
      stack, stackStart, color, sum, pos, start, p, x, y, i;

  stack = stackStart = new CV.BlurStack();
  for (i = 1; i < size; ++ i){
    stack = stack.next = new CV.BlurStack();
  }
  stack.next = stackStart;

  pos = 0;

  for (y = 0; y < height; ++ y){
    start = pos;

    color = src[pos];
    sum = radius * color;

    stack = stackStart;
    for (i = 0; i < radius; ++ i){
      stack.color = color;
      stack = stack.next;
    }
    for (i = 1; i < radius; ++ i){
      stack.color = src[pos + i];
      sum += stack.color;
      stack = stack.next;
    }

    stack = stackStart;
    for (x = 0; x < width; ++ x){
      dst[pos ++] = (sum * mult) >>> shift;

      p = x + radius;
      p = start + (p < widthMinus1? p: widthMinus1);
      sum -= stack.color - src[p];

      stack.color = src[p];
      stack = stack.next;
    }
  }

  for (x = 0; x < width; ++ x){
    pos = x;
    start = pos + width;

    color = dst[pos];
    sum = radius * color;

    stack = stackStart;
    for (i = 0; i < radius; ++ i){
      stack.color = color;
      stack = stack.next;
    }
    for (i = 1; i < radius; ++ i){
      stack.color = dst[start];
      sum += stack.color;
      stack = stack.next;

      start += width;
    }

    stack = stackStart;
    for (y = 0; y < height; ++ y){
      dst[pos] = (sum * mult) >>> shift;

      p = y + radius;
      p = x + ( (p < heightMinus1? p: heightMinus1) * width );
      sum -= stack.color - dst[p];

      stack.color = dst[p];
      stack = stack.next;

      pos += width;
    }
  }

  return imageDst;
};

CV.gaussianBlur = function(imageSrc, imageDst, imageMean, kernelSize){
  var kernel = CV.gaussianKernel(kernelSize);

  imageDst.width = imageSrc.width;
  imageDst.height = imageSrc.height;

  imageMean.width = imageSrc.width;
  imageMean.height = imageSrc.height;

  CV.gaussianBlurFilter(imageSrc, imageMean, kernel, true);
  CV.gaussianBlurFilter(imageMean, imageDst, kernel, false);

  return imageDst;
};

CV.gaussianBlurFilter = function(imageSrc, imageDst, kernel, horizontal){
  var src = imageSrc.data, dst = imageDst.data,
      height = imageSrc.height, width = imageSrc.width,
      pos = 0, limit = kernel.length >> 1,
      cur, value, i, j, k;

  for (i = 0; i < height; ++ i){

    for (j = 0; j < width; ++ j){
      value = 0.0;

      for (k = -limit; k <= limit; ++ k){

        if (horizontal){
          cur = pos + k;
          if (j + k < 0){
            cur = pos;
          }
          else if (j + k >= width){
            cur = pos;
          }
        }else{
          cur = pos + (k * width);
          if (i + k < 0){
            cur = pos;
          }
          else if (i + k >= height){
            cur = pos;
          }
        }

        value += kernel[limit + k] * src[cur];
      }

      dst[pos ++] = horizontal? value: (value + 0.5) & 0xff;
    }
  }

  return imageDst;
};

CV.gaussianKernel = function(kernelSize){
  var tab =
    [ [1],
      [0.25, 0.5, 0.25],
      [0.0625, 0.25, 0.375, 0.25, 0.0625],
      [0.03125, 0.109375, 0.21875, 0.28125, 0.21875, 0.109375, 0.03125] ],
    kernel = [], center, sigma, scale2X, sum, x, i;

  if ( (kernelSize <= 7) && (kernelSize % 2 === 1) ){
    kernel = tab[kernelSize >> 1];
  }else{
    center = (kernelSize - 1.0) * 0.5;
    sigma = 0.8 + (0.3 * (center - 1.0) );
    scale2X = -0.5 / (sigma * sigma);
    sum = 0.0;
    for (i = 0; i < kernelSize; ++ i){
      x = i - center;
      sum += kernel[i] = Math.exp(scale2X * x * x);
    }
    sum = 1 / sum;
    for (i = 0; i < kernelSize; ++ i){
      kernel[i] *= sum;
    }
  }

  return kernel;
};

CV.findContours = function(imageSrc, binary){
  var width = imageSrc.width, height = imageSrc.height, contours = [],
      src, deltas, pos, pix, nbd, outer, hole, i, j;

  src = CV.binaryBorder(imageSrc, binary);

  deltas = CV.neighborhoodDeltas(width + 2);

  pos = width + 3;
  nbd = 1;

  for (i = 0; i < height; ++ i, pos += 2){

    for (j = 0; j < width; ++ j, ++ pos){
      pix = src[pos];

      if (0 !== pix){
        outer = hole = false;

        if (1 === pix && 0 === src[pos - 1]){
          outer = true;
        }
        else if (pix >= 1 && 0 === src[pos + 1]){
          hole = true;
        }

        if (outer || hole){
          ++ nbd;

          contours.push( CV.borderFollowing(src, pos, nbd, {x: j, y: i}, hole, deltas) );
        }
      }
    }
  }

  return contours;
};

CV.borderFollowing = function(src, pos, nbd, point, hole, deltas){
  var contour = [], pos1, pos3, pos4, s, s_end, s_prev;

  contour.hole = hole;

  s = s_end = hole? 0: 4;
  do{
    s = (s - 1) & 7;
    pos1 = pos + deltas[s];
    if (src[pos1] !== 0){
      break;
    }
  }while(s !== s_end);

  if (s === s_end){
    src[pos] = -nbd;
    contour.push( {x: point.x, y: point.y} );

  }else{
    pos3 = pos;
    s_prev = s ^ 4;

    while(true){
      s_end = s;

      do{
        pos4 = pos3 + deltas[++ s];
      }while(src[pos4] === 0);

      s &= 7;

      if ( ( (s - 1) >>> 0) < (s_end >>> 0) ){
        src[pos3] = -nbd;
      }
      else if (src[pos3] === 1){
        src[pos3] = nbd;
      }

      contour.push( {x: point.x, y: point.y} );

      s_prev = s;

      point.x += CV.neighborhood[s][0];
      point.y += CV.neighborhood[s][1];

      if ( (pos4 === pos) && (pos3 === pos1) ){
        break;
      }

      pos3 = pos4;
      s = (s + 4) & 7;
    }
  }

  return contour;
};

CV.neighborhood =
  [ [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1] ];

CV.neighborhoodDeltas = function(width){
  var deltas = [], len = CV.neighborhood.length, i = 0;

  for (; i < len; ++ i){
    deltas[i] = CV.neighborhood[i][0] + (CV.neighborhood[i][1] * width);
  }

  return deltas.concat(deltas);
};

CV.approxPolyDP = function(contour, epsilon){
  var slice = {start_index: 0, end_index: 0},
      right_slice = {start_index: 0, end_index: 0},
      poly = [], stack = [], len = contour.length,
      pt, start_pt, end_pt, dist, max_dist, le_eps,
      dx, dy, i, j, k;

  epsilon *= epsilon;

  k = 0;

  for (i = 0; i < 3; ++ i){
    max_dist = 0;

    k = (k + right_slice.start_index) % len;
    start_pt = contour[k];
    if (++ k === len) {k = 0;}

    for (j = 1; j < len; ++ j){
      pt = contour[k];
      if (++ k === len) {k = 0;}

      dx = pt.x - start_pt.x;
      dy = pt.y - start_pt.y;
      dist = dx * dx + dy * dy;

      if (dist > max_dist){
        max_dist = dist;
        right_slice.start_index = j;
      }
    }
  }

  if (max_dist <= epsilon){
    poly.push( {x: start_pt.x, y: start_pt.y} );

  }else{
    slice.start_index = k;
    slice.end_index = (right_slice.start_index += slice.start_index);

    right_slice.start_index -= right_slice.start_index >= len? len: 0;
    right_slice.end_index = slice.start_index;
    if (right_slice.end_index < right_slice.start_index){
      right_slice.end_index += len;
    }

    stack.push( {start_index: right_slice.start_index, end_index: right_slice.end_index} );
    stack.push( {start_index: slice.start_index, end_index: slice.end_index} );
  }

  while(stack.length !== 0){
    slice = stack.pop();

    end_pt = contour[slice.end_index % len];
    start_pt = contour[k = slice.start_index % len];
    if (++ k === len) {k = 0;}

    if (slice.end_index <= slice.start_index + 1){
      le_eps = true;

    }else{
      max_dist = 0;

      dx = end_pt.x - start_pt.x;
      dy = end_pt.y - start_pt.y;

      for (i = slice.start_index + 1; i < slice.end_index; ++ i){
        pt = contour[k];
        if (++ k === len) {k = 0;}

        dist = Math.abs( (pt.y - start_pt.y) * dx - (pt.x - start_pt.x) * dy);

        if (dist > max_dist){
          max_dist = dist;
          right_slice.start_index = i;
        }
      }

      le_eps = max_dist * max_dist <= epsilon * (dx * dx + dy * dy);
    }

    if (le_eps){
      poly.push( {x: start_pt.x, y: start_pt.y} );

    }else{
      right_slice.end_index = slice.end_index;
      slice.end_index = right_slice.start_index;

      stack.push( {start_index: right_slice.start_index, end_index: right_slice.end_index} );
      stack.push( {start_index: slice.start_index, end_index: slice.end_index} );
    }
  }

  return poly;
};

CV.warp = function(imageSrc, imageDst, contour, warpSize){
  var src = imageSrc.data, dst = imageDst.data,
      width = imageSrc.width, height = imageSrc.height,
      pos = 0,
      sx1, sx2, dx1, dx2, sy1, sy2, dy1, dy2, p1, p2, p3, p4,
      m, r, s, t, u, v, w, x, y, i, j;

  m = CV.getPerspectiveTransform(contour, warpSize - 1);

  r = m[8];
  s = m[2];
  t = m[5];

  for (i = 0; i < warpSize; ++ i){
    r += m[7];
    s += m[1];
    t += m[4];

    u = r;
    v = s;
    w = t;

    for (j = 0; j < warpSize; ++ j){
      u += m[6];
      v += m[0];
      w += m[3];

      x = v / u;
      y = w / u;

      sx1 = x >>> 0;
      sx2 = (sx1 === width - 1)? sx1: sx1 + 1;
      dx1 = x - sx1;
      dx2 = 1.0 - dx1;

      sy1 = y >>> 0;
      sy2 = (sy1 === height - 1)? sy1: sy1 + 1;
      dy1 = y - sy1;
      dy2 = 1.0 - dy1;

      p1 = p2 = sy1 * width;
      p3 = p4 = sy2 * width;

      dst[pos ++] =
        (dy2 * (dx2 * src[p1 + sx1] + dx1 * src[p2 + sx2]) +
         dy1 * (dx2 * src[p3 + sx1] + dx1 * src[p4 + sx2]) ) & 0xff;

    }
  }

  imageDst.width = warpSize;
  imageDst.height = warpSize;

  return imageDst;
};

CV.getPerspectiveTransform = function(src, size){
  var rq = CV.square2quad(src);

  rq[0] /= size;
  rq[1] /= size;
  rq[3] /= size;
  rq[4] /= size;
  rq[6] /= size;
  rq[7] /= size;

  return rq;
};

CV.square2quad = function(src){
  var sq = [], px, py, dx1, dx2, dy1, dy2, den;

  px = src[0].x - src[1].x + src[2].x - src[3].x;
  py = src[0].y - src[1].y + src[2].y - src[3].y;

  if (0 === px && 0 === py){
    sq[0] = src[1].x - src[0].x;
    sq[1] = src[2].x - src[1].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y;
    sq[4] = src[2].y - src[1].y;
    sq[5] = src[0].y;
    sq[6] = 0;
    sq[7] = 0;
    sq[8] = 1;

  }else{
    dx1 = src[1].x - src[2].x;
    dx2 = src[3].x - src[2].x;
    dy1 = src[1].y - src[2].y;
    dy2 = src[3].y - src[2].y;
    den = dx1 * dy2 - dx2 * dy1;

    sq[6] = (px * dy2 - dx2 * py) / den;
    sq[7] = (dx1 * py - px * dy1) / den;
    sq[8] = 1;
    sq[0] = src[1].x - src[0].x + sq[6] * src[1].x;
    sq[1] = src[3].x - src[0].x + sq[7] * src[3].x;
    sq[2] = src[0].x;
    sq[3] = src[1].y - src[0].y + sq[6] * src[1].y;
    sq[4] = src[3].y - src[0].y + sq[7] * src[3].y;
    sq[5] = src[0].y;
  }

  return sq;
};

CV.isContourConvex = function(contour){
  var orientation = 0, convex = true,
      len = contour.length, i = 0, j = 0,
      cur_pt, prev_pt, dxdy0, dydx0, dx0, dy0, dx, dy;

  prev_pt = contour[len - 1];
  cur_pt = contour[0];

  dx0 = cur_pt.x - prev_pt.x;
  dy0 = cur_pt.y - prev_pt.y;

  for (; i < len; ++ i){
    if (++ j === len) {j = 0;}

    prev_pt = cur_pt;
    cur_pt = contour[j];

    dx = cur_pt.x - prev_pt.x;
    dy = cur_pt.y - prev_pt.y;
    dxdy0 = dx * dy0;
    dydx0 = dy * dx0;

    orientation |= dydx0 > dxdy0? 1: (dydx0 < dxdy0? 2: 3);

    if (3 === orientation){
        convex = false;
        break;
    }

    dx0 = dx;
    dy0 = dy;
  }

  return convex;
};

CV.perimeter = function(poly){
  var len = poly.length, i = 0, j = len - 1,
      p = 0.0, dx, dy;

  for (; i < len; j = i ++){
    dx = poly[i].x - poly[j].x;
    dy = poly[i].y - poly[j].y;

    p += Math.sqrt(dx * dx + dy * dy) ;
  }

  return p;
};

CV.minEdgeLength = function(poly){
  var len = poly.length, i = 0, j = len - 1,
      min = Infinity, d, dx, dy;

  for (; i < len; j = i ++){
    dx = poly[i].x - poly[j].x;
    dy = poly[i].y - poly[j].y;

    d = dx * dx + dy * dy;

    if (d < min){
      min = d;
    }
  }

  return Math.sqrt(min);
};

CV.countNonZero = function(imageSrc, square){
  var src = imageSrc.data, height = square.height, width = square.width,
      pos = square.x + (square.y * imageSrc.width),
      span = imageSrc.width - width,
      nz = 0, i, j;

  for (i = 0; i < height; ++ i){

    for (j = 0; j < width; ++ j){

      if ( 0 !== src[pos ++] ){
        ++ nz;
      }
    }

    pos += span;
  }

  return nz;
};

CV.binaryBorder = function(imageSrc, dst){
  var src = imageSrc.data, height = imageSrc.height, width = imageSrc.width,
      posSrc = 0, posDst = 0, i, j;

  for (j = -2; j < width; ++ j){
    dst[posDst ++] = 0;
  }

  for (i = 0; i < height; ++ i){
    dst[posDst ++] = 0;

    for (j = 0; j < width; ++ j){
      dst[posDst ++] = (0 === src[posSrc ++]? 0: 1);
    }

    dst[posDst ++] = 0;
  }

  for (j = -2; j < width; ++ j){
    dst[posDst ++] = 0;
  }

  return dst;
};

/*
Copyright (c) 2020 Damiano Falcioni
Copyright (c) 2011 Juan Mellado

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
References:
- "ArUco: a minimal library for Augmented Reality applications based on OpenCv"
  http://www.uco.es/investiga/grupos/ava/node/26
- "js-aruco: a port to JavaScript of the ArUco library"
  https://github.com/jcmellado/js-aruco
*/

var AR = {};
var CV = this.CV || require('./cv').CV;
this.AR = AR;

AR.DICTIONARIES = {};

AR.Dictionary = function (dicName) {
  this.codes = {};
  this.codeList = [];
  this.tau = 0;
  this._initialize(dicName);
};

AR.Dictionary.prototype._initialize = function (dicName) {
  this.codes = {};
  this.codeList = [];
  this.tau = 0;
  this.nBits = 0;
  this.markSize = 0;
  this.dicName = dicName;
  var dictionary = AR.DICTIONARIES[dicName];
  if (!dictionary)
    throw 'The dictionary "' + dicName + '" is not recognized.';
  
  this.nBits = dictionary.nBits;
  this.markSize = Math.sqrt(dictionary.nBits) + 2;
  for (var i = 0; i < dictionary.codeList.length; i++) {
    var code = null;
    if (typeof dictionary.codeList[i] === 'number')
      code = this._hex2bin(dictionary.codeList[i], dictionary.nBits);
    if (typeof dictionary.codeList[i] === 'string')
      code = this._hex2bin(parseInt(dictionary.codeList[i], 16), dictionary.nBits);
    if (Array.isArray(dictionary.codeList[i])) 
      code = this._bytes2bin(dictionary.codeList[i], dictionary.nBits);
    if (code === null) 
      throw 'Invalid code ' + i + ' in dictionary ' + dicName + ': ' + JSON.stringify(dictionary.codeList[i]);
    if (code.length != dictionary.nBits)
      throw 'The code ' + i + ' in dictionary ' + dicName + ' is not ' +  dictionary.nBits + ' bits long but ' + code.length + ': ' + code;
    this.codeList.push(code);
    this.codes[code] = {
      id: i
    };
  }
  this.tau = dictionary.tau || this._calculateTau();
};

AR.Dictionary.prototype.find = function (bits) {
  var val = '',
    i, j;
  for (i = 0; i < bits.length; i++) {
    var bitRow = bits[i];
    for (j = 0; j < bitRow.length; j++) {
      val += bitRow[j];
    }
  }
  var minFound = this.codes[val];
  if (minFound)
    return {
      id: minFound.id,
      distance: 0
    };

  for (i = 0; i < this.codeList.length; i++) {
    var code = this.codeList[i];
    var distance = this._hammingDistance(val, code);
    if (this._hammingDistance(val, code) < this.tau) {
      if (!minFound || minFound.distance > distance) {
        minFound = {
          id: this.codes[code].id,
          distance: distance
        };
      }
    }
  }
  return minFound;
};

AR.Dictionary.prototype._hex2bin = function (hex, nBits) {
  return hex.toString(2).padStart(nBits, '0');
};

AR.Dictionary.prototype._bytes2bin = function (byteList, nBits) {
  var bits = '', byte;
  for (byte of byteList) {
    bits += byte.toString(2).padStart(bits.length + 8 > nBits?nBits - bits.length:8, '0');
  }
  return bits;
};

AR.Dictionary.prototype._hammingDistance = function (str1, str2) {
  if (str1.length != str2.length)
    throw 'Hamming distance calculation require inputs of the same length';
  var distance = 0,
    i;
  for (i = 0; i < str1.length; i++)
    if (str1[i] !== str2[i])
      distance += 1;
  return distance;
};

AR.Dictionary.prototype._calculateTau = function () {
  var tau = Number.MAX_VALUE;
  for(var i=0;i<this.codeList.length;i++)
    for(var j=i+1;j<this.codeList.length;j++) {
      var distance = this._hammingDistance(this.codeList[i], this.codeList[j]);
      tau = distance < tau ? distance : tau;
    }
  return tau;
};

AR.Dictionary.prototype.generateSVG = function (id) {
  var code = this.codeList[id];
  if (code == null)
    throw 'The id "' + id + '" is not valid for the dictionary "' + this.dicName + '". ID must be between 0 and ' + (this.codeList.length-1) + ' included.';
  var size = this.markSize - 2;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+ (size+4) + ' ' + (size+4) + '">';
  svg += '<rect x="0" y="0" width="' + (size+4) + '" height="' + (size+4) + '" fill="white"/>';
  svg += '<rect x="1" y="1" width="' + (size+2) + '" height="' + (size+2) + '" fill="black"/>';
  for(var y=0;y<size;y++) {
    for(var x=0;x<size;x++) {
      if (code[y*size+x]=='1') 
        svg += '<rect x="' + (x+2) + '" y="' + (y+2) + '" width="1" height="1" fill="white"/>';
    }
  }
  svg += '</svg>';
  return svg;
};

AR.Marker = function (id, corners, hammingDistance) {
  this.id = id;
  this.corners = corners;
  this.hammingDistance = hammingDistance;
};

AR.Detector = function (config) {
  config = config || {};
  this.grey = new CV.Image();
  this.thres = new CV.Image();
  this.homography = new CV.Image();
  this.binary = [];
  this.contours = [];
  this.polys = [];
  this.candidates = [];
  config.dictionaryName = config.dictionaryName || 'ARUCO_MIP_36h12';
  this.dictionary = new AR.Dictionary(config.dictionaryName);
  this.dictionary.tau = config.maxHammingDistance != null ? config.maxHammingDistance : this.dictionary.tau;
};

AR.Detector.prototype.detectImage = function (width, height, data) {
  return this.detect({
    width: width,
    height: height,
    data: data
  });
};

AR.Detector.prototype.detectStreamInit = function (width, height, callback) {
  this.streamConfig = {};
  this.streamConfig.width = width;
  this.streamConfig.height = height;
  this.streamConfig.imageSize = width * height * 4; //provided image must be a sequence of rgba bytes (4 bytes represent a pixel)
  this.streamConfig.index = 0;
  this.streamConfig.imageData = new Uint8ClampedArray(this.streamConfig.imageSize);
  this.streamConfig.callback = callback || function (image, markerList) {};
};

//accept data chunks of different sizes
AR.Detector.prototype.detectStream = function (data) {
  for (var i = 0; i < data.length; i++) {
    this.streamConfig.imageData[this.streamConfig.index] = data[i];
    this.streamConfig.index = (this.streamConfig.index + 1) % this.streamConfig.imageSize;
    if (this.streamConfig.index == 0) {
      var image = {
        width: this.streamConfig.width,
        height: this.streamConfig.height,
        data: this.streamConfig.imageData
      };
      var markerList = this.detect(image);
      this.streamConfig.callback(image, markerList);
    }
  }
};

AR.Detector.prototype.detectMJPEGStreamInit = function (width, height, callback, decoderFn) {
  this.mjpeg = {
    decoderFn: decoderFn,
    chunks: [],
    SOI: [0xff, 0xd8],
    EOI: [0xff, 0xd9]
  };
  this.detectStreamInit(width, height, callback);
};

AR.Detector.prototype.detectMJPEGStream = function (chunk) {
  var eoiPos = chunk.findIndex(function (element, index, array) {
    return this.mjpeg.EOI[0] == element && array.length > index + 1 && this.mjpeg.EOI[1] == array[index + 1];
  });
  var soiPos = chunk.findIndex(function (element, index, array) {
    return this.mjpeg.SOI[0] == element && array.length > index + 1 && this.mjpeg.SOI[1] == array[index + 1];
  });

  if (eoiPos === -1) {
    this.mjpeg.chunks.push(chunk);
  } else {
    var part1 = chunk.slice(0, eoiPos + 2);
    if (part1.length) {
      this.mjpeg.chunks.push(part1);
    }
    if (this.mjpeg.chunks.length) {
      var jpegImage = this.mjpeg.chunks.flat();
      var rgba = this.mjpeg.decoderFn(jpegImage);
      this.detectStream(rgba);
    }
    this.mjpeg.chunks = [];
  }
  if (soiPos > -1) {
    this.mjpeg.chunks = [];
    this.mjpeg.chunks.push(chunk.slice(soiPos));
  }
};

AR.Detector.prototype.detect = function (image) {
  CV.grayscale(image, this.grey);
  CV.adaptiveThreshold(this.grey, this.thres, 2, 7);

  this.contours = CV.findContours(this.thres, this.binary);
  //Scale Fix: https://stackoverflow.com/questions/35936397/marker-detection-on-paper-sheet-using-javascript
  //this.candidates = this.findCandidates(this.contours, image.width * 0.20, 0.05, 10);
  this.candidates = this.findCandidates(this.contours, image.width * 0.01, 0.05, 10);
  this.candidates = this.clockwiseCorners(this.candidates);
  this.candidates = this.notTooNear(this.candidates, 10);

  return this.findMarkers(this.grey, this.candidates, 49);
};

AR.Detector.prototype.findCandidates = function (contours, minSize, epsilon, minLength) {
  var candidates = [],
    len = contours.length,
    contour, poly, i;

  this.polys = [];

  for (i = 0; i < len; ++i) {
    contour = contours[i];

    if (contour.length >= minSize) {
      poly = CV.approxPolyDP(contour, contour.length * epsilon);

      this.polys.push(poly);

      if ((4 === poly.length) && (CV.isContourConvex(poly))) {

        if (CV.minEdgeLength(poly) >= minLength) {
          candidates.push(poly);
        }
      }
    }
  }

  return candidates;
};

AR.Detector.prototype.clockwiseCorners = function (candidates) {
  var len = candidates.length,
    dx1, dx2, dy1, dy2, swap, i;

  for (i = 0; i < len; ++i) {
    dx1 = candidates[i][1].x - candidates[i][0].x;
    dy1 = candidates[i][1].y - candidates[i][0].y;
    dx2 = candidates[i][2].x - candidates[i][0].x;
    dy2 = candidates[i][2].y - candidates[i][0].y;

    if ((dx1 * dy2 - dy1 * dx2) < 0) {
      swap = candidates[i][1];
      candidates[i][1] = candidates[i][3];
      candidates[i][3] = swap;
    }
  }

  return candidates;
};

AR.Detector.prototype.notTooNear = function (candidates, minDist) {
  var notTooNear = [],
    len = candidates.length,
    dist, dx, dy, i, j, k;

  for (i = 0; i < len; ++i) {

    for (j = i + 1; j < len; ++j) {
      dist = 0;

      for (k = 0; k < 4; ++k) {
        dx = candidates[i][k].x - candidates[j][k].x;
        dy = candidates[i][k].y - candidates[j][k].y;

        dist += dx * dx + dy * dy;
      }

      if ((dist / 4) < (minDist * minDist)) {

        if (CV.perimeter(candidates[i]) < CV.perimeter(candidates[j])) {
          candidates[i].tooNear = true;
        } else {
          candidates[j].tooNear = true;
        }
      }
    }
  }

  for (i = 0; i < len; ++i) {
    if (!candidates[i].tooNear) {
      notTooNear.push(candidates[i]);
    }
  }

  return notTooNear;
};

AR.Detector.prototype.findMarkers = function (imageSrc, candidates, warpSize) {
  var markers = [],
    len = candidates.length,
    candidate, marker, i;

  for (i = 0; i < len; ++i) {
    candidate = candidates[i];

    CV.warp(imageSrc, this.homography, candidate, warpSize);

    CV.threshold(this.homography, this.homography, CV.otsu(this.homography));

    marker = this.getMarker(this.homography, candidate);
    if (marker) {
      markers.push(marker);
    }
  }

  return markers;
};

AR.Detector.prototype.getMarker = function (imageSrc, candidate) {
  var markSize = this.dictionary.markSize;
  var width = (imageSrc.width / markSize) >>> 0,
    minZero = (width * width) >> 1,
    bits = [],
    rotations = [],
    square, inc, i, j;

  for (i = 0; i < markSize; ++i) {
    inc = (0 === i || (markSize - 1) === i) ? 1 : (markSize - 1);

    for (j = 0; j < markSize; j += inc) {
      square = {
        x: j * width,
        y: i * width,
        width: width,
        height: width
      };
      if (CV.countNonZero(imageSrc, square) > minZero) {
        return null;
      }
    }
  }

  for (i = 0; i < markSize - 2; ++i) {
    bits[i] = [];

    for (j = 0; j < markSize - 2; ++j) {
      square = {
        x: (j + 1) * width,
        y: (i + 1) * width,
        width: width,
        height: width
      };

      bits[i][j] = CV.countNonZero(imageSrc, square) > minZero ? 1 : 0;
    }
  }

  rotations[0] = bits;

  var foundMin = null;
  var rot = 0;
  for (i = 0; i < 4; i++) {
    var found = this.dictionary.find(rotations[i]);
    if (found && (foundMin === null || found.distance < foundMin.distance)) {
      foundMin = found;
      rot = i;
      if (foundMin.distance === 0)
        break;
    }
    rotations[i + 1] = this.rotate(rotations[i]);
  }

  if (foundMin)
    return new AR.Marker(foundMin.id, this.rotate2(candidate, 4 - rot), foundMin.distance);

  return null;
};

AR.Detector.prototype.rotate = function (src) {
  var dst = [],
    len = src.length,
    i, j;

  for (i = 0; i < len; ++i) {
    dst[i] = [];
    for (j = 0; j < src[i].length; ++j) {
      dst[i][j] = src[src[i].length - j - 1][i];
    }
  }

  return dst;
};

AR.Detector.prototype.rotate2 = function (src, rotation) {
  var dst = [],
    len = src.length,
    i;

  for (i = 0; i < len; ++i) {
    dst[i] = src[(rotation + i) % len];
  }

  return dst;
};

/* Đọc thẻ trả lời từ ảnh chụp lớp. Dùng CV và AR của js-aruco2 (MIT).
   Mỗi thẻ là mã 4×4 có viền đen; chữ cái ở cạnh trên của thẻ trong ảnh là đáp án. */
var THE = (function () {
  var CODES = ["0569","07cb","0b5b","0db5","10b5","12de","136d","14a6","14d7","14f9","15ad","165b","1692","16bc","1869","19ab","1a5d","1a73","1a94","1acb","1ae5","1b09","1b27","1b56","1b78","1b9f","1c25","1c7a","1d2e","1d96","1de7","1e3f","1ea9","1f6b","214d","21db","239e","249c","24b2","252f","255e","2597","25b9","25e6","26d9","271b","278d","287d","2929","29bf","29ce","2b1d","2b6c","2b8b","2ba5","2d3a","2d4b","2d65","2d82","2dac","2e93","2ebd","2fc7","2fe9","31a7","31d6","32c7","32e9","335a","3429","357d","359a","35c5","35eb","361d","368b","36a5","36fa","385e","3897","38b9","390a","397b","39c3","39ed","3a1b","3a6a","3a8d","3ad2","3bd9","3caa","3cdb","3cf5","3d8f","3da1","3e79","3e9e","3f2d","3f95","417d","41c5","41eb","4349","45a7","475a","47bd","49a1","4b2d","4b95","4d7b","4ded","4f3e","4fd9","507b","50ed","523e","524f","52d9","531b","536a","538d","55db","562d","56bb","579e","581f","586e","58a7","58d6","593a","594b","59f3","5a2b","5a93","5abd","5b0e","5bb6","5bc7","5be9","5c7d","5ceb","5d29","5e49","5f1d","5f8b","5fa5","6399","65be","695f","6d3d","703d","70ab","7169","729f","735d","73cb","745f","74c9","759d","7859","78be","78cf","790d","799b","7a6d","7b39","7c3b","7cad","7e99","90a9","916b","929d","935f","945d","959f","973d","97ab","985b","9af9","9bad","9d6d","9e9b","b2db","27d2"];   // thẻ mới 12/11: 46 bộ × 4 chữ
  var LETTERS = ['A', 'B', 'C', 'D'];
  AR.DICTIONARIES.THE_LOP = { nBits: 16, tau: 1, codeList: CODES };   // thẻ mới: khớp đủ 16 ô mới nhận
  var detector = new AR.Detector({ dictionaryName: 'THE_LOP', maxHammingDistance: 1 });

  /* ---------- 9/11: đọc nhanh hơn, kết quả y hệt bản js-aruco2 ----------
     Bản gốc tạo một đối tượng {x, y} cho từng điểm của mọi đường viền (vài trăm nghìn điểm mỗi khung), nên chậm.
     Ở đây: làm mờ hộp 5×5 theo hàng (cùng công thức làm tròn), ghi thẳng ảnh nhị phân có viền 1 điểm ảnh;
     dò viền và rút gọn đa giác trên mảng số dùng lại giữa các khung. Thứ tự dò, cách đánh dấu và phép tính
     giữ nguyên, nên danh sách ứng viên và thẻ đọc được trùng khớp với bản gốc (bài thử so từng khung). */
  var NBX = [1, 1, 0, -1, -1, -1, 0, 1], NBY = [0, -1, -1, -1, 0, 1, 1, 1];
  var BO = {};   // bộ đệm theo kích thước, dùng lại giữa các khung
  function dem(ten, Kieu, n) {
    var a = BO[ten];
    if (!a || a.length !== n) a = BO[ten] = new Kieu(n);
    return a;
  }
  var XS = new Int32Array(1 << 16), YS = new Int32Array(1 << 16), STK = new Int32Array(1024);
  function noRong(n) {
    var m = XS.length; while (m < n) m *= 2;
    var a = new Int32Array(m), b = new Int32Array(m); a.set(XS); b.set(YS); XS = a; YS = b;
  }
  // ảnh nhị phân có viền: 1 nếu điểm tối hơn trung bình 5×5 quanh nó ít nhất 7 (như CV.adaptiveThreshold(…, 2, 7))
  function nguong(g, w, h, bin, vai) {
    var hang = dem("hang" + vai, Uint8Array, w * h), cot = dem("cot" + vai, Int32Array, w);
    var W2 = w + 2, wm = w - 1, hm = h - 1, x, y, r, s, a, b, ra, rr, rb;
    // viền 1 điểm ảnh quanh ảnh nhị phân luôn là 0 (bộ đệm có thể vừa dùng cho khung xoay ngang/dọc cùng số điểm ảnh)
    bin.fill(0, 0, W2); bin.fill(0, (h + 1) * W2, (h + 2) * W2);
    for (y = 1; y <= h; y++) { bin[y * W2] = 0; bin[y * W2 + w + 1] = 0; }
    for (y = 0; y < h; y++) {
      r = y * w;
      s = 3 * g[r] + g[r + 1] + g[r + 2];
      for (x = 0; x < w; x++) {
        hang[r + x] = (s * 205) >>> 10;
        a = x + 3; if (a > wm) a = wm;
        b = x - 2; if (b < 0) b = 0;
        s += g[r + a] - g[r + b];
      }
    }
    for (x = 0; x < w; x++) cot[x] = 3 * hang[x] + hang[w + x] + hang[2 * w + x];
    for (y = 0; y < h; y++) {
      ra = (y + 3 > hm ? hm : y + 3) * w; rr = (y - 2 < 0 ? 0 : y - 2) * w; r = y * w; rb = (y + 1) * W2 + 1;
      for (x = 0; x < w; x++) {
        bin[rb + x] = (g[r + x] - ((cot[x] * 205) >>> 10) <= -7) ? 1 : 0;
        cot[x] += hang[ra + x] - hang[rr + x];
      }
    }
  }
  // dò một đường viền (như CV.borderFollowing), điểm ghi vào XS, YS; trả về số điểm
  var DT = 0;   // hai lần diện tích bao bởi đường viền vừa dò
  function theoVien(src, pos, nbd, px, py, hole, D) {
    var n = 0, pos1 = 0, pos3, pos4, s, se;
    DT = 0;
    s = se = hole ? 0 : 4;
    do {
      s = (s - 1) & 7;
      pos1 = pos + D[s];
      if (src[pos1] !== 0) break;
    } while (s !== se);
    if (s === se) { src[pos] = -nbd; XS[0] = px; YS[0] = py; return 1; }
    pos3 = pos;
    while (true) {
      se = s;
      do { pos4 = pos3 + D[++s]; } while (src[pos4] === 0);
      s &= 7;
      if (((s - 1) >>> 0) < (se >>> 0)) src[pos3] = -nbd;
      else if (src[pos3] === 1) src[pos3] = nbd;
      if (n === XS.length) noRong(n + 1);
      XS[n] = px; YS[n] = py; n++;
      DT += px * NBY[s] - py * NBX[s];
      px += NBX[s]; py += NBY[s];
      if (pos4 === pos && pos3 === pos1) break;
      pos3 = pos4;
      s = (s + 4) & 7;
    }
    return n;
  }
  // rút gọn đa giác (như CV.approxPolyDP) trên XS, YS; dừng sớm khi đã quá 4 đỉnh (không thể là thẻ)
  function xapXi(len, eps) {
    var poly = [], sp = 0, rs = 0, re = 0, ss, se, k = 0, i, j, md = 0, d, dx, dy, sx = 0, sy = 0, ex, ey, le;
    eps *= eps;
    for (i = 0; i < 3; ++i) {
      md = 0;
      k = (k + rs) % len;
      sx = XS[k]; sy = YS[k];
      if (++k === len) k = 0;
      for (j = 1; j < len; ++j) {
        dx = XS[k] - sx; dy = YS[k] - sy;
        if (++k === len) k = 0;
        d = dx * dx + dy * dy;
        if (d > md) { md = d; rs = j; }
      }
    }
    if (md <= eps) { poly.push({ x: sx, y: sy }); return poly; }
    ss = k; se = (rs += ss);
    rs -= rs >= len ? len : 0;
    re = ss; if (re < rs) re += len;
    STK[sp++] = rs; STK[sp++] = re; STK[sp++] = ss; STK[sp++] = se;
    while (sp !== 0) {
      se = STK[--sp]; ss = STK[--sp];
      ex = XS[se % len]; ey = YS[se % len];
      k = ss % len; sx = XS[k]; sy = YS[k];
      if (++k === len) k = 0;
      if (se <= ss + 1) le = true;
      else {
        md = 0; dx = ex - sx; dy = ey - sy;
        for (i = ss + 1; i < se; ++i) {
          d = Math.abs((YS[k] - sy) * dx - (XS[k] - sx) * dy);
          if (++k === len) k = 0;
          if (d > md) { md = d; rs = i; }
        }
        le = md * md <= eps * (dx * dx + dy * dy);
      }
      if (le) { poly.push({ x: sx, y: sy }); if (poly.length > 4) return null; }
      else {
        re = se; se = rs;
        if (sp + 4 > STK.length) { var t = new Int32Array(STK.length * 2); t.set(STK); STK = t; }
        STK[sp++] = rs; STK[sp++] = re; STK[sp++] = ss; STK[sp++] = se;
      }
    }
    return poly;
  }
  // các đa giác 4 đỉnh lồi, cạnh ngắn nhất ≥ minLength (như findContours rồi findCandidates)
  function ungVien(g, w, h, minSize, minLength, vai) {
    var W2 = w + 2, bin = dem("bin" + vai, Int32Array, W2 * (h + 2)), D = new Int32Array(16), out = [], i, j, pos, pix, nbd = 1, n, p;
    nguong(g, w, h, bin, vai);
    for (i = 0; i < 8; i++) D[i] = D[i + 8] = NBX[i] + NBY[i] * W2;
    pos = W2 + 1;
    for (i = 0; i < h; ++i, pos += 2) {
      for (j = 0; j < w; ++j, ++pos) {
        pix = bin[pos];
        if (pix === 0) continue;
        var outer = pix === 1 && bin[pos - 1] === 0, hole = !outer && pix >= 1 && bin[pos + 1] === 0;
        if (!outer && !hole) continue;
        ++nbd;
        n = theoVien(bin, pos, nbd, j, i, hole, D);
        if (n < minSize) continue;
        // viền của nét chữ, đường kẻ, vết nhiễu thì dài mà bao rất ít diện tích, không thể là khung vuông của thẻ:
        // bỏ qua trước khi rút gọn đa giác. DT là hai lần diện tích; khung thẻ vuông cho DT ≈ 0,125 × số điểm²,
        // nghiêng xa tới mức thành hình thang 3:1 vẫn ≈ 0,09 (đo trên 1293 lượt đọc được: nhỏ nhất 0,114), nên ngưỡng 0,04 còn dư nhiều.
        if (Math.abs(DT) < 0.04 * n * n) continue;
        p = xapXi(n, n * 0.05);
        if (p && p.length === 4 && CV.isContourConvex(p) && CV.minEdgeLength(p) >= minLength) out.push(p);
      }
    }
    return out;
  }


  function toGrey(rgba, n) {
    var g = new Uint8ClampedArray(n);
    for (var i = 0, j = 0; j < n; i += 4, j++) g[j] = (rgba[i] * 77 + rgba[i + 1] * 150 + rgba[i + 2] * 29) >> 8;
    return g;
  }

  function halve(g, w, h) {
    var w2 = w >> 1, h2 = h >> 1, o = new Uint8ClampedArray(w2 * h2);
    for (var y = 0; y < h2; y++) {
      var s = 2 * y * w, d = y * w2;
      for (var x = 0; x < w2; x++, s += 2) o[d + x] = (g[s] + g[s + 1] + g[s + w] + g[s + w + 1] + 2) >> 2;
    }
    return { g: o, w: w2, h: h2 };
  }

  function letterOf(c) {
    // c[0], c[1] là cạnh trên của mã khi in (cạnh có chữ A)
    var ux = (c[0].x + c[1].x - c[2].x - c[3].x) / 2, uy = (c[0].y + c[1].y - c[2].y - c[3].y) / 2;
    var deg = Math.atan2(ux, -uy) * 180 / Math.PI;
    return LETTERS[((Math.round(deg / 90) % 4) + 4) % 4];
  }

  function shapeOk(c) {
    var s = [];
    for (var i = 0; i < 4; i++) {
      var a = c[i], b = c[(i + 1) % 4];
      s.push(Math.hypot(a.x - b.x, a.y - b.y));
    }
    var mn = Math.min.apply(null, s), mx = Math.max.apply(null, s);
    return { ok: mn > 0 && mx / mn < 3, size: (s[0] + s[1] + s[2] + s[3]) / 4 };
  }

  // Thẻ mới 12/11: độ "dẹt" của tứ giác = cos góc nghiêng của thẻ so với hướng nhìn (1: nhìn thẳng mặt thẻ).
  // Thẻ đang giơ lệch tới 45° vẫn trên 0,7; thẻ nằm ngửa trên bàn nhìn từ chỗ thầy đứng thường dưới 0,45.
  var DET_MIN = 0.5;   // nghiêng quá 60°: coi là thẻ nằm trên bàn, bỏ
  function doDet(c) {
    var ax = ((c[1].x - c[0].x) + (c[2].x - c[3].x)) / 2, ay = ((c[1].y - c[0].y) + (c[2].y - c[3].y)) / 2;
    var bx = ((c[3].x - c[0].x) + (c[2].x - c[1].x)) / 2, by = ((c[3].y - c[0].y) + (c[2].y - c[1].y)) / 2;
    var p = ax * ax + ay * ay, q = ax * bx + ay * by, r = bx * bx + by * by;
    var tr = p + r, k = Math.sqrt(Math.max(0, tr * tr / 4 - (p * r - q * q)));
    return tr > 0 ? Math.sqrt(Math.max(0, tr / 2 - k) / (tr / 2 + k)) : 0;
  }

  function pass(g, w, h, scale, out, vai) {
    var grey = new CV.Image(w, h, g);
    var cands = ungVien(g, w, h, Math.min(40, Math.max(16, w * 0.01)), 8, vai || "F");
    cands = detector.clockwiseCorners(cands);
    cands = detector.notTooNear(cands, 6);
    var found = detector.findMarkers(grey, cands, 49);
    for (var i = 0; i < found.length; i++) {
      var m = found[i];
      var corners = m.corners.map(function (p) { return { x: (p.x + 0.5) * scale, y: (p.y + 0.5) * scale }; });
      var sh = shapeOk(corners);
      if (!sh.ok) continue;
      var det = doDet(corners), kk = m.id % 4;   // mã = (số thẻ − 1) × 4 + chữ (0..3 = A..D); det dưới DET_MIN thì scan() bỏ
      out.push({
        id: (m.id - kk) / 4 + 1, ma: m.id + 1, det: det, dist: m.hammingDistance, corners: corners, size: sh.size,
        cx: (corners[0].x + corners[1].x + corners[2].x + corners[3].x) / 4,
        cy: (corners[0].y + corners[1].y + corners[2].y + corners[3].y) / 4,
        letter: LETTERS[kk], k: kk
      });
    }
    return { candidates: cands.length };
  }

  /* ---------- 13/11/2026: thẻ nằm ngửa trên bàn ----------
     Thầy Thịnh quét thử ở lớp: "có mấy thẻ để dưới bàn và một thẻ cầm trên tay thì … máy hay quét các thẻ nằm dưới bàn".
     Luật cũ (det dưới 0,5) chỉ loại thẻ nghiêng quá 60° so với hướng nhìn. Thầy đứng sát bàn nhìn xuống thì thẻ trên bàn chỉ
     nghiêng 40 đến 55° nên lọt. Cách mới: điện thoại cho biết hướng "trên" (cảm biến nghiêng); từ 4 góc của khung mã tính được
     mặt thẻ đang quay về đâu. Mặt thẻ ngửa lên trần (lệch hướng "trên" dưới chừng 30°) là thẻ nằm trên bàn, bỏ.
       - Chỉ nhìn độ dẹt thì không đủ: thẻ nằm và thẻ dựng "soi gương qua tia nhìn" cho cùng một hình dẹt. Hai thẻ đó khác nhau
         ở chỗ cạnh nào xa hơn (cạnh xa ngắn hơn), nên phải khớp cả phép chiếu phối cảnh, và 4 góc phải chính xác dưới 1 điểm ảnh
         (tinhGoc dò lại mép đen/trắng của khung mã).
       - ttSai(n): sai số nhỏ nhất khi đặt một hình vuông (tuỳ cỡ, tuỳ xoay, tuỳ chỗ) lên mặt phẳng có pháp tuyến n rồi chiếu lên 4 góc.
         eL = sai số nhỏ nhất với n trong chóp TT.CHOP độ quanh hướng "trên"; eR = nhỏ nhất với n lệch hướng "trên" từ TT.DUNG độ.
         Chắc nằm (2): eL nhỏ và eR lớn hơn hẳn. Chắc dựng (0): ngược lại, hoặc độ dẹt không thể là của thẻ nằm. Còn lại: chưa rõ (1).
       - Đo: 2 ảnh lớp thầy gửi 13/11 (2 thẻ nằm đều ra 2, thẻ đang giơ ra 0, kể cả khi cảm biến lệch 10°) và khung giả đúng phép
         chiếu (ban-the-moi/test/thu-tu-the.js).
     Không có hướng "trên" (máy không có cảm biến, trang chưa được phép đọc) thì bỏ qua phần này, còn luật det như cũ. */
  var TT = { CHOP: 25, DUNG: 42, NGUONG: 3, TILE: 4, TOT: 0.012, DET: 0.3 };
  var ttR = new Float64Array(8), ttM = new Float64Array(20), ttX = new Float64Array(4), ttN = new Float64Array(3);
  var ttU = new Float64Array(3), ttV = new Float64Array(3), ttCx = 0, ttCy = 0, ttCChop = 0, ttCDung = 0;
  var TT_S = [-1, -1, 1, 1], TT_T = [-1, 1, 1, -1];   // khuôn 4 góc theo chiều kim đồng hồ nhìn từ camera, trong hệ (e1, e2) của mặt thẻ (e1 × e2 = n)
  var ttKq = { eL: -1, eR: -1, uv: 0 };               // số đo của lần quyết định gần nhất (cho bài thử)
  // tổng bình phương sai số (đơn vị: điểm ảnh chia tiêu cự) khi khớp hình vuông trên mặt phẳng có pháp tuyến (nx, ny, nz) với 4 tia ttR
  function ttSai(nx, ny, nz) {
    var ax, ay, az, l, bx, by, bz, i, j, d, s, t, r, c, A1, A2, k, v0, v1, v2, v3, p, f, e, sse = 0;
    if (Math.abs(nx) < 0.6) { ax = 0; ay = -nz; az = ny; } else { ax = nz; ay = 0; az = -nx; }
    l = Math.sqrt(ax * ax + ay * ay + az * az); ax /= l; ay /= l; az /= l;                   // e1 vuông góc n
    bx = ny * az - nz * ay; by = nz * ax - nx * az; bz = nx * ay - ny * ax;                   // e2 = n × e1
    for (i = 0; i < 20; i++) ttM[i] = 0;
    for (i = 0; i < 4; i++) {
      s = TT_S[i]; t = TT_T[i];
      for (d = 0; d < 2; d++) {
        r = ttR[i * 2 + d]; c = d ? ttCy : ttCx;
        A1 = (d ? ay : ax) - r * az; A2 = (d ? by : bx) - r * bz; k = r - c;
        v0 = A1; v1 = A2; v2 = A1 * s + A2 * t; v3 = A2 * s - A1 * t;
        ttM[0] += v0 * v0; ttM[1] += v0 * v1; ttM[2] += v0 * v2; ttM[3] += v0 * v3; ttM[4] += v0 * k;
        ttM[6] += v1 * v1; ttM[7] += v1 * v2; ttM[8] += v1 * v3; ttM[9] += v1 * k;
        ttM[12] += v2 * v2; ttM[13] += v2 * v3; ttM[14] += v2 * k;
        ttM[18] += v3 * v3; ttM[19] += v3 * k;
      }
    }
    ttM[5] = ttM[1]; ttM[10] = ttM[2]; ttM[11] = ttM[7]; ttM[15] = ttM[3]; ttM[16] = ttM[8]; ttM[17] = ttM[13];
    for (i = 0; i < 4; i++) {
      p = ttM[i * 5 + i];
      if (!(p > 1e-18)) return Infinity;
      for (j = i + 1; j < 4; j++) {
        f = ttM[j * 5 + i] / p;
        if (f) for (c = i; c < 5; c++) ttM[j * 5 + c] -= f * ttM[i * 5 + c];
      }
    }
    for (i = 3; i >= 0; i--) { s = ttM[i * 5 + 4]; for (j = i + 1; j < 4; j++) s -= ttM[i * 5 + j] * ttX[j]; ttX[i] = s / ttM[i * 5 + i]; }
    for (i = 0; i < 4; i++) {
      s = TT_S[i]; t = TT_T[i];
      for (d = 0; d < 2; d++) {
        r = ttR[i * 2 + d]; c = d ? ttCy : ttCx;
        A1 = (d ? ay : ax) - r * az; A2 = (d ? by : bx) - r * bz;
        e = A1 * ttX[0] + A2 * ttX[1] + (A1 * s + A2 * t) * ttX[2] + (A2 * s - A1 * t) * ttX[3] + (c - r);
        sse += e * e;
      }
    }
    return sse;
  }
  // pháp tuyến (nx, ny, nz) lệch đi góc g (rad) theo phương vị p quanh nó; kết quả ghi vào ttN
  function ttLech(nx, ny, nz, g, p) {
    var ax, ay, az, l, bx, by, bz, sg = Math.sin(g), cg = Math.cos(g), cp = Math.cos(p) * sg, sp = Math.sin(p) * sg;
    if (Math.abs(nx) < 0.6) { ax = 0; ay = -nz; az = ny; } else { ax = nz; ay = 0; az = -nx; }
    l = Math.sqrt(ax * ax + ay * ay + az * az); ax /= l; ay /= l; az /= l;
    bx = ny * az - nz * ay; by = nz * ax - nx * az; bz = nx * ay - ny * ax;
    ttN[0] = nx * cg + ax * cp + bx * sp; ttN[1] = ny * cg + ay * cp + by * sp; ttN[2] = nz * cg + az * cp + bz * sp;
  }
  // vung 1: trong chóp quanh hướng "trên"; vung 2: "đang dựng" (lệch hướng "trên" từ TT.DUNG độ). Luôn phải quay mặt về camera.
  function ttDuoc(x, y, z, vung) {
    var cu = x * ttU[0] + y * ttU[1] + z * ttU[2];
    if (vung === 1 ? cu < ttCChop : cu > ttCDung) return false;
    return x * ttV[0] + y * ttV[1] + z * ttV[2] > 0.12;
  }
  // dò cực tiểu của ttSai từ (nx, ny, nz), bước giảm dần, không ra khỏi vùng; trả về sai số nhỏ nhất
  function ttDo(nx, ny, nz, vung) {
    var e = ttSai(nx, ny, nz), buoc = 0.1, k, em, tx = 0, ty = 0, tz = 0, et, co;
    while (buoc > 0.006) {
      et = e; co = false;
      for (k = 0; k < 8; k++) {
        ttLech(nx, ny, nz, buoc, k * 0.7853981633974483);
        if (!ttDuoc(ttN[0], ttN[1], ttN[2], vung)) continue;
        em = ttSai(ttN[0], ttN[1], ttN[2]);
        if (em < et) { et = em; tx = ttN[0]; ty = ttN[1]; tz = ttN[2]; co = true; }
      }
      if (co) { nx = tx; ny = ty; nz = tz; e = et; } else buoc /= 2;
    }
    return e;
  }
  // c: 4 góc của khung mã (điểm ảnh của khung đang đọc), w × h: cỡ khung, f: tiêu cự tính bằng điểm ảnh của khung đó,
  // u: hướng "trên" trong hệ ảnh (x sang phải, y xuống dưới, z từ camera đi tới), det: độ dẹt, size: cạnh mã (điểm ảnh).
  // Trả về 2: chắc là thẻ nằm ngửa trên mặt ngang; 1: chưa rõ; 0: không phải thẻ nằm.
  // Kiểm nhanh bằng 4 góc thô: thẻ này có thể đang nằm ngang không? Không thì khỏi tinh chỉnh góc, khỏi tính tư thế (phần lớn thẻ đang giơ
  // dừng ở đây, nên phép lọc gần như không làm chậm bộ đọc). Nới 0,02 so với hai phép thử đầu của tuThe: ca sát ngưỡng vẫn được tính đủ.
  function ttSom(c, w, h, f, u, det) {
    var cx = 0, cy = 0, i, l, lu, uv;
    for (i = 0; i < 4; i++) { cx += (c[i].x - w / 2) / f / 4; cy += (c[i].y - h / 2) / f / 4; }
    l = Math.sqrt(cx * cx + cy * cy + 1); lu = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]) || 1;
    uv = (-cx * u[0] - cy * u[1] - u[2]) / (l * lu);
    return uv >= 0.13 && !(det != null && Math.abs(det - uv) > TT.DET + 0.02);
  }
  function tuThe(c, w, h, f, u, det, size) {
    var i, l, uv, eL, eR, k, e, g0, g1, g2, ds = [], tran;
    ttCx = 0; ttCy = 0;
    for (i = 0; i < 4; i++) { ttR[i * 2] = (c[i].x - w / 2) / f; ttR[i * 2 + 1] = (c[i].y - h / 2) / f; ttCx += ttR[i * 2] / 4; ttCy += ttR[i * 2 + 1] / 4; }
    l = Math.sqrt(ttCx * ttCx + ttCy * ttCy + 1);
    ttV[0] = -ttCx / l; ttV[1] = -ttCy / l; ttV[2] = -1 / l;                 // từ thẻ về camera
    l = Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]) || 1;
    ttU[0] = u[0] / l; ttU[1] = u[1] / l; ttU[2] = u[2] / l;
    uv = ttU[0] * ttV[0] + ttU[1] * ttV[1] + ttU[2] * ttV[2];
    ttKq.eL = -1; ttKq.eR = -1; ttKq.uv = uv;
    if (uv < 0.15) return 0;                                                  // camera không ở phía trên mặt bàn tại chỗ thẻ này
    if (det != null && Math.abs(det - uv) > TT.DET) return 0;                 // độ dẹt không thể là của thẻ nằm ngang
    ttCChop = Math.cos(TT.CHOP * Math.PI / 180); ttCDung = Math.cos(TT.DUNG * Math.PI / 180);
    eL = ttDo(ttU[0], ttU[1], ttU[2], 1) * f * f;
    // ứng viên "đang dựng": nghiệm gương của hướng "trên" qua tia nhìn, nhìn thẳng mặt thẻ, và vòng 50° quanh hướng "trên"
    g0 = 2 * uv * ttV[0] - ttU[0]; g1 = 2 * uv * ttV[1] - ttU[1]; g2 = 2 * uv * ttV[2] - ttU[2];
    if (ttDuoc(g0, g1, g2, 2)) ds.push([ttSai(g0, g1, g2), g0, g1, g2]);
    if (ttDuoc(ttV[0], ttV[1], ttV[2], 2)) ds.push([ttSai(ttV[0], ttV[1], ttV[2]), ttV[0], ttV[1], ttV[2]]);
    for (k = 0; k < 8; k++) {
      ttLech(ttU[0], ttU[1], ttU[2], 0.8726646259971648, k * 0.7853981633974483);
      if (ttDuoc(ttN[0], ttN[1], ttN[2], 2)) ds.push([ttSai(ttN[0], ttN[1], ttN[2]), ttN[0], ttN[1], ttN[2]]);
    }
    ds.sort(function (a, b) { return a[0] - b[0]; });
    eR = Infinity;
    for (k = 0; k < ds.length && k < 3; k++) { e = ttDo(ds[k][1], ds[k][2], ds[k][3], 2); if (e < eR) eR = e; }
    eR *= f * f;
    ttKq.eL = eL; ttKq.eR = eR;
    tran = Math.max(TT.NGUONG, TT.TOT * size * TT.TOT * size * 8);            // sai số còn chấp nhận được của nghiệm "nằm"
    if (eL <= tran && eR - eL >= TT.NGUONG && eR >= TT.TILE * eL) return 2;
    if (eL - eR >= TT.NGUONG && eL >= TT.TILE * eR) return 0;
    return 1;
  }
  // nội suy song tuyến trên ảnh xám; (X, Y) theo toạ độ góc thẻ (tâm điểm ảnh ở +0,5)
  function layDiem(g, w, h, X, Y) {
    var x = X - 0.5, y = Y - 0.5, x0, y0, fx, fy, i;
    if (x < 0) x = 0; else if (x > w - 1.001) x = w - 1.001;
    if (y < 0) y = 0; else if (y > h - 1.001) y = h - 1.001;
    x0 = x | 0; y0 = y | 0; fx = x - x0; fy = y - y0; i = y0 * w + x0;
    return (g[i] * (1 - fx) + g[i + 1] * fx) * (1 - fy) + (g[i + w] * (1 - fx) + g[i + w + 1] * fx) * fy;
  }
  // Tinh chỉnh 4 góc khung mã tới mức dưới 1 điểm ảnh: dò mép đen/trắng dọc từng cạnh (điểm cắt mức giữa), khớp đường thẳng,
  // lấy giao điểm. Trả về 4 góc mới, hoặc null nếu mép không đủ rõ (khi đó dùng góc cũ).
  var tgPr = new Float64Array(40);
  function tinhGoc(g, w, h, c) {
    var size = 0, i, a, b, dx, dy, l, ux, uy, nx, ny, k, j, t, bx, by, s, lo, hi, mid, tot, px, py, K, R, nb, dg = [], out = [];
    for (i = 0; i < 4; i++) { a = c[i]; b = c[(i + 1) % 4]; size += Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) / 4; }
    R = Math.max(3, Math.min(7, size * 0.05)); K = Math.max(8, Math.min(24, Math.round(size / 5)));
    nb = Math.round(R * 2) * 2 + 1;   // bước 0,5 điểm ảnh
    for (i = 0; i < 4; i++) {
      a = c[i]; b = c[(i + 1) % 4];
      dx = b.x - a.x; dy = b.y - a.y; l = Math.sqrt(dx * dx + dy * dy);
      if (l < 6) return null;
      ux = dx / l; uy = dy / l; nx = uy; ny = -ux;   // (nx, ny) hướng ra ngoài khung (4 góc theo chiều kim đồng hồ, y xuống)
      px = []; py = [];
      for (k = 0; k < K; k++) {
        t = 0.14 + 0.72 * (k + 0.5) / K; bx = a.x + dx * t; by = a.y + dy * t;
        for (j = 0; j < nb; j++) { s = (j - (nb - 1) / 2) * 0.5; tgPr[j] = layDiem(g, w, h, bx + nx * s, by + ny * s); }
        lo = (tgPr[0] + tgPr[1] + tgPr[2]) / 3; hi = (tgPr[nb - 1] + tgPr[nb - 2] + tgPr[nb - 3]) / 3;
        if (hi - lo < 18) continue;
        mid = (lo + hi) / 2; tot = null;
        for (j = 0; j < nb - 1; j++) if (tgPr[j] < mid && tgPr[j + 1] >= mid) {
          s = (j - (nb - 1) / 2 + (mid - tgPr[j]) / (tgPr[j + 1] - tgPr[j])) * 0.5;
          if (tot === null || Math.abs(s) < Math.abs(tot)) tot = s;
        }
        if (tot === null) continue;
        px.push(bx + nx * tot); py.push(by + ny * tot);
      }
      if (px.length < Math.max(4, K * 0.4)) return null;
      // khớp đường thẳng (bình phương tối thiểu toàn phần), bỏ điểm lệch quá 1 điểm ảnh rồi khớp lại
      var dgT = null, vong, mx, my, n, sxx, sxy, syy, ex, ey, th;
      for (vong = 0; vong < 2; vong++) {
        mx = 0; my = 0; n = 0;
        for (k = 0; k < px.length; k++) { if (dgT && Math.abs((px[k] - dgT.x) * dgT.dy - (py[k] - dgT.y) * dgT.dx) > 1) continue; mx += px[k]; my += py[k]; n++; }
        if (n < 4) return null;
        mx /= n; my /= n; sxx = 0; sxy = 0; syy = 0;
        for (k = 0; k < px.length; k++) { if (dgT && Math.abs((px[k] - dgT.x) * dgT.dy - (py[k] - dgT.y) * dgT.dx) > 1) continue; ex = px[k] - mx; ey = py[k] - my; sxx += ex * ex; sxy += ex * ey; syy += ey * ey; }
        th = 0.5 * Math.atan2(2 * sxy, sxx - syy);
        dgT = { x: mx, y: my, dx: Math.cos(th), dy: Math.sin(th) };
      }
      dg.push(dgT);
    }
    for (i = 0; i < 4; i++) {
      var p = dg[(i + 3) % 4], q = dg[i], den = p.dx * q.dy - p.dy * q.dx;   // góc i = giao của cạnh (i − 1) và cạnh i
      if (Math.abs(den) < 1e-6) return null;
      t = ((q.x - p.x) * q.dy - (q.y - p.y) * q.dx) / den;
      var X = p.x + p.dx * t, Y = p.y + p.dy * t;
      if (Math.sqrt((X - c[i].x) * (X - c[i].x) + (Y - c[i].y) * (Y - c[i].y)) > Math.max(3, size * 0.08)) return null;   // dời nhiều quá: không tin
      out.push({ x: X, y: Y });
    }
    return out;
  }

  /* ---------- 13/11/2026: đọc thẳng khung hình của camera (VideoFrame), không qua canvas ----------
     Số đo của thầy 13/11: riêng việc lấy hình qua canvas mất 0,1 giây mỗi khung, bằng thời gian đọc thẻ. Trang chính gửi sang
     đây nguyên vùng nhớ của khung hình; phần này rút lớp sáng (Y) ra ảnh xám ở đúng cỡ của làn rồi đọc, khỏi đổi sang màu rồi đổi lại. */
  // độ sáng trung bình (lấy mẫu thưa) của ảnh xám: cho phần giữ phơi sáng ngắn
  function doSang(g, w, h) {
    var s = 0, n = 0, x, y, r, bx = Math.max(1, w >> 6), by = Math.max(1, h >> 6);
    for (y = by >> 1; y < h; y += by) { r = y * w; for (x = bx >> 1; x < w; x += bx) { s += g[r + x]; n++; } }
    return n ? s / n : 0;
  }
  // ảnh nhỏ N × N ô (trung bình từng ô) của một mặt phẳng điểm ảnh: để so đường mới với đường canvas lúc vừa bật camera
  function anhNho(d, off, stride, w, h, buocByte, N) {
    var o = new Uint8Array(N * N), i, j, x, y, x0, x1, y0, y1, s, n, r, bx, by;
    for (j = 0; j < N; j++) {
      y0 = Math.floor(j * h / N); y1 = Math.max(y0 + 1, Math.floor((j + 1) * h / N)); by = Math.max(1, (y1 - y0) >> 3);
      for (i = 0; i < N; i++) {
        x0 = Math.floor(i * w / N); x1 = Math.max(x0 + 1, Math.floor((i + 1) * w / N)); bx = Math.max(1, (x1 - x0) >> 3);
        s = 0; n = 0;
        for (y = y0; y < y1; y += by) { r = off + y * stride; for (x = x0; x < x1; x += bx) { s += d[r + x * buocByte]; n++; } }
        o[j * N + i] = n ? Math.round(s / n) : 0;
      }
    }
    return o;
  }
  var LUT_CU = null, LUT_A = 0, LUT_B = 0;
  function bangSang(a, b) {
    if (LUT_CU && LUT_A === a && LUT_B === b) return LUT_CU;
    var t = new Uint8Array(256), i, v;
    for (i = 0; i < 256; i++) { v = Math.round(a * i + b); t[i] = v < 0 ? 0 : v > 255 ? 255 : v; }
    LUT_CU = t; LUT_A = a; LUT_B = b;
    return t;
  }
  var YUV8 = { I420: 1, I420A: 1, I422: 1, I444: 1, NV12: 1, NV21: 1 }, RGB4 = { RGBA: 0, RGBX: 0, BGRA: 2, BGRX: 2 };
  // kh: {buf: ArrayBuffer, dd: định dạng điểm ảnh, lay: [{offset, stride}…], w0, h0: cỡ khung, sc: tỉ lệ thu (≤ 1), lut: [a, b] hoặc null}
  // Trả về {g, w, h} ảnh xám ở cỡ làn, hoặc null nếu định dạng không đọc được.
  function xamTuKhung(kh) {
    var d = new Uint8Array(kh.buf), w0 = kh.w0, h0 = kh.h0, off, stride, g0, x, y, r, i, lut = kh.lut ? bangSang(kh.lut[0], kh.lut[1]) : null;
    var sc = kh.sc > 0 && kh.sc < 1 ? kh.sc : 1, w, h, g, src, sw, sh, sst, soff;
    if (!kh.lay || !kh.lay.length || !(w0 > 0 && h0 > 0)) return null;
    off = kh.lay[0].offset | 0; stride = kh.lay[0].stride | 0;
    if (YUV8[kh.dd]) {
      if (stride < w0 || off + stride * (h0 - 1) + w0 > d.length) return null;
      src = d; soff = off; sst = stride;
    } else if (RGB4[kh.dd] != null) {
      if (stride < w0 * 4 || off + stride * (h0 - 1) + w0 * 4 > d.length) return null;
      var ri = RGB4[kh.dd], bi = 2 - ri;   // RGBA: đỏ ở byte 0; BGRA: đỏ ở byte 2
      g0 = new Uint8Array(w0 * h0);
      for (y = 0; y < h0; y++) { r = off + y * stride; i = y * w0; for (x = 0; x < w0; x++, r += 4) g0[i + x] = (d[r + ri] * 77 + d[r + 1] * 150 + d[r + bi] * 29) >> 8; }
      src = g0; soff = 0; sst = w0;
    } else return null;
    sw = w0; sh = h0;
    // thu quá nửa: lấy trung bình 2 × 2 trước (đúng bằng lượt "nửa cỡ" của bộ đọc), phần còn lại nội suy
    while (sc <= 0.5 + 1e-9) {
      var w2 = sw >> 1, h2 = sh >> 1, o2 = new Uint8Array(w2 * h2), a, b2;
      for (y = 0; y < h2; y++) { a = soff + 2 * y * sst; b2 = a + sst; i = y * w2; for (x = 0; x < w2; x++, a += 2, b2 += 2) o2[i + x] = (src[a] + src[a + 1] + src[b2] + src[b2 + 1] + 2) >> 2; }
      src = o2; soff = 0; sst = w2; sw = w2; sh = h2; sc *= 2;
    }
    if (sc >= 0.999) {
      w = sw; h = sh;
      if (soff === 0 && sst === w && !lut && src !== d) g = src;
      else {
        g = new Uint8Array(w * h);
        if (lut) for (y = 0; y < h; y++) { r = soff + y * sst; i = y * w; for (x = 0; x < w; x++) g[i + x] = lut[src[r + x]]; }
        else for (y = 0; y < h; y++) g.set(src.subarray(soff + y * sst, soff + y * sst + w), y * w);
      }
      return { g: g, w: w, h: h };
    }
    // nội suy song tuyến về cỡ làn (tỉ lệ giữa 0,5 và 1: mỗi điểm lấy từ 4 điểm quanh nó)
    w = Math.max(1, Math.round(sw * sc)); h = Math.max(1, Math.round(sh * sc));
    g = new Uint8Array(w * h);
    var kx = sw / w, ky = sh / h, X0 = new Int32Array(w), FX = new Int32Array(w), fx, fy, y0, r0, r1, p0, v, f1;
    for (x = 0; x < w; x++) { v = (x + 0.5) * kx - 0.5; if (v < 0) v = 0; if (v > sw - 1.001) v = sw - 1.001; X0[x] = v | 0; FX[x] = Math.round((v - (v | 0)) * 256); }
    for (y = 0; y < h; y++) {
      v = (y + 0.5) * ky - 0.5; if (v < 0) v = 0; if (v > sh - 1.001) v = sh - 1.001;
      y0 = v | 0; fy = Math.round((v - y0) * 256); f1 = 256 - fy; r0 = soff + y0 * sst; r1 = r0 + sst; i = y * w;
      for (x = 0; x < w; x++) {
        p0 = X0[x]; fx = FX[x];
        v = ((src[r0 + p0] * (256 - fx) + src[r0 + p0 + 1] * fx) * f1 + (src[r1 + p0] * (256 - fx) + src[r1 + p0 + 1] * fx) * fy + 32768) >> 16;
        g[i + x] = lut ? lut[v] : v;
      }
    }
    return { g: g, w: w, h: h };
  }

  // image: {data: RGBA, width, height}; maxId: số thẻ của lớp
  // tuy.chiDu: chỉ đọc ở cỡ đủ, bỏ lượt nửa cỡ (camera có làn đọc khung nhỏ riêng cho thẻ ở gần)
  // tuy.len = [x, y, z]: hướng "trên" trong hệ ảnh; tuy.f: tiêu cự tính bằng điểm ảnh của khung này. Có đủ hai thứ thì bỏ thẻ nằm ngửa trên bàn.
  function scan(image, maxId, tuy) {
    return scanXam(toGrey(image.data, image.width * image.height), image.width, image.height, maxId, tuy);
  }
  // kh: khung hình camera gửi thẳng sang (xem xamTuKhung). Toạ độ thẻ trả về theo cỡ ảnh xám đã thu (w × h trong kết quả).
  function scanKhung(kh, maxId, tuy) {
    var t0 = performance.now(), x = xamTuKhung(kh);
    if (!x) throw new Error("không đọc được khung " + kh.dd);
    var t1 = performance.now(), r = scanXam(x.g, x.w, x.h, maxId, tuy);
    r.w = x.w; r.h = x.h; r.tgDoi = t1 - t0;
    return r;
  }
  function scanXam(g, w, h, maxId, tuy) {
    var raw = [];
    var info = { full: pass(g, w, h, 1, raw, "F") };
    if (!(tuy && tuy.chiDu)) {
      var hf = halve(g, w, h);
      info.half = pass(hf.g, hf.w, hf.h, 2, raw, "H");
    }
    var best = {}, nam = {};
    raw.forEach(function (m) {
      if (m.id > maxId) return;
      // thẻ nghiêng quá 60° (det dưới DET_MIN): coi là thẻ nằm trên bàn, không tính; để riêng ra cho phần ghi số đo của bản thử
      if (m.det < DET_MIN) { var cn = nam[m.ma]; if (!cn || m.size > cn.size) nam[m.ma] = m; return; }
      var cur = best[m.ma];
      if (!cur) { best[m.ma] = m; return; }
      var far = Math.hypot(cur.cx - m.cx, cur.cy - m.cy) > Math.max(cur.size, m.size);
      var better = m.dist < cur.dist || (m.dist === cur.dist && m.size > cur.size);
      if (better) { m.dup = cur.dup || far; best[m.ma] = m; } else if (far) cur.dup = true;
    });
    var all = Object.keys(best).map(function (k) { return best[k]; });
    // Bỏ "thẻ" nhỏ nằm trong vùng của một thẻ lớn hơn (chữ cái, số in trên thẻ)
    var list = all.filter(function (m) {
      return !all.some(function (M) {
        return M !== m && M.size >= 1.8 * m.size && Math.hypot(M.cx - m.cx, M.cy - m.cy) < 0.9 * M.size;
      });
    });
    // 13/11: thẻ nằm ngửa trên bàn (xem tuThe). Cần hướng "trên" của cảm biến nghiêng (tuy.len) và tiêu cự (tuy.f, điểm ảnh của khung này).
    //   Chắc nằm: bỏ khỏi danh sách, để vào nam kèm vi = 1 (trang vẽ viền xám, không ghi). Chưa rõ: giữ, kèm ngo = true để trang chờ
    //   thêm vài lần đọc rồi mới ghi. Làm TRƯỚC luật "một em 2 thẻ": thẻ em đang giơ không bị thẻ nằm trên bàn của chính em làm kẹt.
    var len = tuy && tuy.len, tieuCu = tuy && tuy.f;
    if (len && tieuCu > 0) {
      list = list.filter(function (m) {
        if (!ttSom(m.corners, w, h, tieuCu, len, m.det)) { m.tt = 0; return true; }   // chắc chắn không nằm ngang: khỏi tính tiếp
        var gt = tinhGoc(g, w, h, m.corners) || m.corners;
        var tt = tuThe(gt, w, h, tieuCu, len, m.det, m.size);
        m.tt = tt;
        if (ttKq.eL >= 0) {   // đã tính đủ hai nghiệm: kèm sai số (điểm ảnh bình phương) và 4 góc đã tinh chỉnh, để trang ghi vào số đo
          m.e = [Math.round(Math.min(1e5, ttKq.eL) * 100) / 100, Math.round(Math.min(1e5, ttKq.eR) * 100) / 100, Math.round(ttKq.uv * 1000) / 1000];
          m.gt = [];
          for (var gi = 0; gi < 4; gi++) m.gt.push(Math.round(gt[gi].x * 100) / 100, Math.round(gt[gi].y * 100) / 100);
        }
        if (tt === 2) { m.vi = 1; nam[m.ma] = m; return false; }
        if (tt === 1) m.ngo = true;
        return true;
      });
    }
    info.sang = doSang(g, w, h);
    // Thẻ mới: một em hiện 2 thẻ khác chữ trong cùng một khung thì không biết em chọn thẻ nào:
    // trả về một thẻ (thẻ to hơn) kèm hai = true để trang báo lên, không ghi.
    var theoSo = {};
    list.forEach(function (m) {
      var cu = theoSo[m.id];
      if (!cu) { theoSo[m.id] = m; return; }
      var giu = m.size > cu.size ? m : cu;
      giu.hai = true;
      theoSo[m.id] = giu;
    });
    list = Object.keys(theoSo).map(function (k) { return theoSo[k]; }).sort(function (a, b) { return a.id - b.id; });
    return { cards: list, nam: Object.keys(nam).map(function (k) { return nam[k]; }), info: info };
  }

  return { scan: scan, scanXam: scanXam, scanKhung: scanKhung, xamTuKhung: xamTuKhung, anhNho: anhNho, tuThe: tuThe, tinhGoc: tinhGoc, ttKq: ttKq, TT: TT, doDet: doDet,
    CODES: CODES, LETTERS: LETTERS, letterOf: letterOf };
})();

