+function($){ 
  "use strict";
  var windowWidth = window.innerWidth;
  var windowHight = window.innerHeight;
  var upload = document.getElementsByTagName('input')[0];
  var image = "";
  var hammertime = "";
  var clearIntervalFun = "";
  var id =0;
  var carType = 0;
  var iswifiopen = false;
  var startPosX=0,startPosY=0,
      posX=0,posY=0,isDrag=false,
      scale=1, last_scale,
      rotation= 0, last_rotation,
      canvas,ctx;
  var init=function() {
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
    var imageControl = document.getElementById("imageControl");
    var imageControlCanvas = document.createElement("canvas");
    imageControl.appendChild(imageControlCanvas);
    imageControlCanvas.width=windowWidth;
    imageControlCanvas.height=windowHight;
    uploadpicInit(imageControlCanvas);
  }

  var orientationchange = function() {
    checkOrientation();
  }

  var uploadpicInit = function(canvas) {

    fileUpload.init("imageControl", "fileInput", canvas);
    window.mySwipe = Swipe(document.getElementById('car'), {
      startSlide: 40,
      speed: 400,
      continuous: true,
      disableScroll: false,
      stopPropagation: false,
      callback: function(index, elem) {},
      transitionEnd: function(index, elem) {
        carType = index%6;
      }
    });

    if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
      Hammer.plugins.showTouches();
    }
  }

  var imagescale = 0;
  var fileUpload = {
  init : function(controlstr, uploadName, canvas) {
    if ( typeof window.FileReader === 'undefined') {
    } else {
      fileUpload.fileInit(controlstr, uploadName, canvas);
    }
  },
  fileInit : function(controlstr, uploadName, canvas) {
    var upload = document.getElementById(uploadName);
    upload.onchange = function() {
      fileUpload.fileUptoHtml(controlstr, upload, canvas);
    };
  },
  detectSubsampling:function (img) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    if (iw * ih > 1024 * 1024) { // subsampling may happen over megapixel image
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, -iw + 1, 0);
      return ctx.getImageData(0, 0, 1, 1).data[3] === 0;
    } else {
      return false;
    }
  },
  detectVerticalSquash :function (img, iw, ih) {
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = ih;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    var data = ctx.getImageData(0, 0, 1, ih).data;
    var sy = 0;
    var ey = ih;
    var py = ih;
    while (py > sy) {
      var alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
      ey = py;
      } else {
      sy = py;
      }
      py = (ey + sy) >> 1;
    }
    var ratio = (py / ih);
    return (ratio===0)?1:ratio;
  },
  fileUptoHtml : function(controlstr, upload, canvas) {
    var file = upload.files[0], reader = new FileReader();
    var image = new Image();
    var imageControl = document.getElementById("imageControl");
    imageControl.style.display = "block";
    var ctx = canvas.getContext("2d");
    reader.onload = function(event) {
      $("#isvifi").show();
      image.src = event.target.result;
    };
    reader.onloadend = function(e) {
      image.onload = function() {
        $("#isvifi").hide();
        $('#jiantou').show();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(0, 0);
        var imgnaturalWidth = image.naturalWidth;
        var imgnaturalHeight = image.naturalHeight;
        var ratio=fileUpload.detectVerticalSquash(image, imgnaturalWidth, imgnaturalHeight);
        var detectbug=fileUpload.detectSubsampling(image);
        if (detectbug) {
          imgnaturalHeight *= 2;
        }
        if(ratio==0.375){
          imagescale = (windowWidth+6) / image.height;
        }else{
          imagescale = (windowHight+6) / image.height;
        }
        ctx.save();
        image.width=imgnaturalWidth*imagescale;
        image.height=imgnaturalHeight*imagescale;
        var xpos = 0;
        var ypos = 0;
        if(ratio==0.375){
          xpos = image.width/2;
          ypos = image.height/2;
          if (detectbug){
            ypos /=2;
          }
          ctx.translate(xpos, ypos);
          ctx.rotate(90 * Math.PI / 180);
          ctx.translate(-xpos, -ypos);
        }
        ctx.drawImage(image,(xpos-ypos),(xpos-ypos),image.width,image.height);
        ctx.restore();
        imageZoom.init(controlstr, canvas, ctx, image, imagescale,ratio);
        $("#commitBtn").on("tap",function () {
          var uploaddiv = document.getElementById("upload");
          var uploadCanvas = document.createElement("canvas");
          uploaddiv.appendChild(uploadCanvas);
          uploadCanvas.width=100;
          uploadCanvas.height=100;
          var uploadCtx = uploadCanvas.getContext("2d");
          var imgData=ctx.getImageData($("#fileInput").offset().left, $("#fileInput").offset().top+12,100,100);
          uploadCtx.putImageData(imgData,0,0);
          document.getElementById("uploadImage").style.display = "block";
          document.getElementById("uploadImage").src = uploadCanvas.toDataURL("image/png");
          uploadCanvas.remove();
          var imageControl = document.getElementById("imageControl");
          imageControl.style.display = "none";
          $("#uploadBtn").hide();
          $("#fileInput").hide();
          $("#body-center").append("<div id='toptips'><div id='tips2'></div><div></div></div>");
          $("#tips2").addClass("toptipsrotate");
          $("#body-center").append("<div id='resizeBtn'></div>");
          $("#commitBtn").off("tap");
          window.addEventListener('shake', shakeEventDidOccur, false);
          $("#resizeBtn").tap(function (){
            reszie();
          });
        });
      };
    };
    reader.readAsDataURL(file);
    return false;
  }
};

var imageZoom = {
  image:"",
  canvas:"",
  ctx:"",
  imagescale:"",
  startPosX:0,
  startPosY : 0,
  posX : 0,
  posY : 0,
  isDrag : false,
  scale : 1,
  last_scale : 0,
  rotation : 0,
  last_rotation : 0,
  detectbug:false,
  ratio:0,
  hammertime :"",
  istransform:false,
  init : function(_controlstr, _canvas, _ctx, _image, _imagescale,_ratio) {
  imageZoom.ratio=_ratio;
    imageZoom.image = _image;
    imageZoom.canvas = _canvas;
    imageZoom.ctx = _ctx;
    imageZoom.imagescale = _imagescale;
    imageZoom.rotation=0;
    if (!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
      Hammer.plugins.showTouches();
    }
    if (!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
      Hammer.plugins.fakeMultitouch();
    }
    var _obj = document.getElementById(_controlstr);
    imageZoom.hammertime = Hammer(_obj, {
      transform_always_block : true,
      transform_min_scale : 1,
      drag_block_horizontal : true,
      drag_block_vertical : true,
      drag_min_distance : 0
    });
    imageZoom.hammertime.on("dragstart", function(e) {
      imageZoom.isDrag = true;
    var imgnaturalWidth = imageZoom.image.naturalWidth;
    var imgnaturalHeight = imageZoom.image.naturalHeight;
    });
    imageZoom.hammertime.on('touch drag transform', imageZoom.touchDragTransform);
    imageZoom.hammertime.on("dragend", function(e) {
      imageZoom.posX = 0;
      imageZoom.posY = 0;
      if (imageZoom.isDrag) {
        imageZoom.startPosX += e.gesture.deltaX;
        imageZoom.startPosY += e.gesture.deltaY;
        imageZoom.isDrag = false;
      }
    });
  },
  offHammertime:function () {
    imageZoom.hammertime.off("dragend");
    imageZoom.hammertime.off("dragstart");
    imageZoom.hammertime.off('touch drag transform',imageZoom.touchDragTransform);
  },
  touchDragTransform : function(ev) {
  imageZoom.detectbug=fileUpload.detectSubsampling(imageZoom.image);
    var xpos = imageZoom.image.width/2;
    var ypos = imageZoom.image.height/2;
  if (imageZoom.detectbug){
    ypos /=2;
  }
  console.log(ev.type);
    switch(ev.type) {
      case 'drag':
        if(imageZoom.istransform) {
          imageZoom.istransform = false;
        } else {
          imageZoom.posX = ev.gesture.deltaX;
          imageZoom.posY = ev.gesture.deltaY;
        }
        break;

      case 'transform':
        imageZoom.posX = 0;
        imageZoom.posY = 0;
        imageZoom.istransform = true;
        imageZoom.rotation = imageZoom.last_rotation + ev.gesture.rotation;
        imageZoom.scale = Math.max(0.2, Math.min(imageZoom.last_scale * ev.gesture.scale, 10));
        break;
    }
    imageZoom.redrawImage(xpos,ypos);
  },
  redrawImage : function(xpos,ypos) {
    imageZoom.ctx.clearRect(0, 0, imageZoom.canvas.width, imageZoom.canvas.height);
    imageZoom.ctx.save();
    imageZoom.ctx.transform(imageZoom.scale, 0, 0, imageZoom.scale, imageZoom.startPosX + imageZoom.posX, imageZoom.startPosY + imageZoom.posY);
    imageZoom.ctx.translate(xpos, ypos);
    imageZoom.ctx.rotate((imageZoom.rotation+((imageZoom.ratio==0.375)?90:0)) * Math.PI / 180);
    imageZoom.ctx.translate(-xpos, -ypos);
    imageZoom.ctx.drawImage(imageZoom.image,0,0,imageZoom.image.width,imageZoom.image.height);
    imageZoom.ctx.restore();
  }
};

  var reszie = function (e) {
    $("#uploadBtn").show();
    $("#fileInput").show();
    $('#jiantou').hide();
    $("#toptips").remove();
    $("#resizeBtn").remove();
    document.getElementById("uploadImage").src = "";
    document.getElementById("uploadImage").style.display = "none";
    imageZoom.offHammertime();
    imageZoom.ctx.clearRect(0, 0, imageZoom.canvas.width, imageZoom.canvas.height);
    image = "";
    imageZoom.offHammertime();
  }
  var isaddSuccessClose = false;
  var shakeEventDidOccur = function() {
    $("#isvifi").show();
    imageZoom.hammertime.off('touch drag transform',imageZoom.touchDragTransform);
    window.removeEventListener('shake', shakeEventDidOccur, false);
    request("POST","http://m.chevrolet.com.cn/act/chevyday/upload_stream.ashx",{cartype:carType,image:document.getElementById('uploadImage').src},function (result){
        $("#isvifi").hide();
        $("#addsuccess").show();
        $("#index_btn").on('tap',function () {
          window.location.href = "index.html?type=upload";
          $("#addsuccess").hide();
          $("#index_btn").off('tap');
        });
        $("#play_btn").on('tap',function () {
          $("#playvideo").show();
          var video = document.getElementById("playvideo");
          video.play();
          reszie();
          $("#addsuccess").hide();
          $("#play_btn").off('tap');
        });
    });
  }

  var request = function(type, url, opts, callback) {
    var xhr = new XMLHttpRequest();
    if (typeof opts === 'function') {
      callback = opts;
      opts = null;
    }
    xhr.open(type, url);
    var fd = new FormData();
    if (type === 'POST' && opts) {
      for (var key in opts) {
        fd.append(key, JSON.stringify(opts[key]));
      }
    }
    xhr.onload = function () {
      callback(xhr.response);
    };
    xhr.send(opts ? fd : null);
  }
  init();
  window.uploadFileInit = shakeEventDidOccur;
}(window.Quo);







