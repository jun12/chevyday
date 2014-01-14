+function($){ 
  "use strict";
  var windowWidth = window.innerWidth;
  var upload = document.getElementsByTagName('input')[0];
  var image = "";
  var hammertime = "";
  var carType = 0;
  var startPosX=0,startPosY=0,
      posX=0,posY=0,isDrag=false,
      scale=1, last_scale,
      rotation= 0, last_rotation,
      canvas,ctx;
  var init=function() {
     upload.onchange = function () {
        uploadFile();
     }
    if (typeof window.FileReader === 'undefined') {
      console.log('fail');
    } else {
      console.log('success');
    }
    window.mySwipe = Swipe(document.getElementById('car'), {
      startSlide: 2,
      speed: 400,
      auto: 3000,
      continuous: false,
      disableScroll: false,
      stopPropagation: false,
      callback: function(index, elem) {},
      transitionEnd: function(index, elem) {
        carType = index;
      }
    });

    if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
      Hammer.plugins.showTouches();
    }

  }

  var uploadFile = function () {
      var file = upload.files[0],reader = new FileReader();
      image = new Image();
      reader.onload = function (event) {
        image.src = event.target.result;
        // document.getElementById('uploadImage').innerHTML = '';
        // document.getElementById('uploadImage').style.backgroundImage='url('+image.src+')';
      };
      reader.onloadend = function (e) {
        canvas = document.getElementById('uploadImage');
        ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image,0, 0, canvas.width, canvas.height);
        $("#uploadBtn").hide();
        $("#fileInput").hide();
        $("#body-center").append("<div id='toptips'><div>");
        $("#body-center").append("<div id='resizeBtn'></div>");
        $("#resizeBtn").tap(reszie);
        window.addEventListener('shake', shakeEventDidOccur, false);
        piczoom();
      }
      reader.readAsDataURL(file);
      return false;
  }

  var reszie = function (e) {
    $("#uploadBtn").show();
    $("#fileInput").show();
    $("#toptips").remove();
    $("#resizeBtn").remove();
    hammertime.off('touch drag transform',touchDragTransform);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  var piczoom = function (canvas,ctx) {
    if(!Hammer.HAS_TOUCHEVENTS && !Hammer.HAS_POINTEREVENTS) {
        Hammer.plugins.fakeMultitouch();
    }

    hammertime = Hammer(document.getElementById('upload'), {
        transform_always_block: true,
        transform_min_scale: 1,
        drag_block_horizontal: true,
        drag_block_vertical: true,
        drag_min_distance: 0
    });
    hammertime.on("dragstart",function (e) {
      isDrag = true;
    });
    hammertime.on('touch drag transform',touchDragTransform);
    hammertime.on("dragend",function (e) {
      posX = 0;
      posY = 0;
      if(isDrag) {
        startPosX+=e.gesture.deltaX;
        startPosY+=e.gesture.deltaY;
        isDrag = false;
      }
    });
  }

  var touchDragTransform = function (ev) {
      var xpos = 50;
      var ypos = 50; 
      switch(ev.type) {
          case 'touch':
              last_scale = scale;
              last_rotation = rotation;
              break;

          case 'drag':
              posX = ev.gesture.deltaX;
              posY = ev.gesture.deltaY;
              break;

          case 'transform':
              rotation = last_rotation + ev.gesture.rotation;
              scale = Math.max(1, Math.min(last_scale * ev.gesture.scale, 10));
              break;
      }
      ctx.clearRect(0, 0,canvas.width, canvas.height);
      ctx.save();
      ctx.transform(scale,0,0,scale,startPosX+posX,startPosY+posY);
      ctx.translate(xpos, ypos);
      ctx.rotate(rotation*Math.PI/180);
      ctx.translate(-xpos, -ypos);
     // ctx.rotate(rotation);
      // var transform =
      //           "translate3d("+posX+"px,"+posY+"px, 0) " +
      //           "scale3d("+scale+","+scale+", 0) " +
      //           "rotate("+rotation+"deg) ";

      // image.style.transform = transform;
      // image.style.oTransform = transform;
      // image.style.msTransform = transform;
      // image.style.mozTransform = transform;
      // // image.style.webkitTransform = transform;
      // var transform = "rotate("+rotation+"deg) ";
      // canvas.style.transform = transform;
      // canvas.style.oTransform = transform;
      // canvas.style.msTransform = transform;
      // canvas.style.mozTransform = transform;
      // canvas.style.webkitTransform = transform;
      ctx.drawImage(image,0, 0,canvas.width, canvas.height);
      ctx.restore();
  }
  //function to call when shake occurs
  var shakeEventDidOccur = function() {
    hammertime.off('touch drag transform',touchDragTransform);
    request("POST","http://m.chevrolet.com.cn/act/chevyday/upload_stream.ashx",{cartype:carType,image:document.getElementById('uploadImage').toDataURL("image/png")},function (result){
        alert(result);
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







