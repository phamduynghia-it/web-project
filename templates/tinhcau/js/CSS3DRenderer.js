THREE.CSS3DObject = function(e) {
    THREE.Object3D.call(this),
    this.element = e,
    this.element.style.position = "absolute",
    this.addEventListener("removed", function() {
        null !== this.element.parentNode && this.element.parentNode.removeChild(this.element)
    })
}
,
THREE.CSS3DObject.prototype = Object.create(THREE.Object3D.prototype),
THREE.CSS3DObject.prototype.constructor = THREE.CSS3DObject,
THREE.CSS3DSprite = function(e) {
    THREE.CSS3DObject.call(this, e)
}
,
THREE.CSS3DSprite.prototype = Object.create(THREE.CSS3DObject.prototype),
THREE.CSS3DSprite.prototype.constructor = THREE.CSS3DSprite,
THREE.CSS3DRenderer = function() {
    var e, t, r, n;
    console.log("THREE.CSS3DRenderer", THREE.REVISION);
    var o = new THREE.Matrix4
      , s = {
        camera: {
            fov: 0,
            style: ""
        },
        objects: {}
    }
      , a = document.createElement("div");
    a.style.overflow = "hidden",
    this.domElement = a;
    var i = document.createElement("div");
    i.style.WebkitTransformStyle = "preserve-3d",
    i.style.MozTransformStyle = "preserve-3d",
    i.style.transformStyle = "preserve-3d",
    a.appendChild(i);
    var l = /Trident/i.test(navigator.userAgent);
    function c(e) {
        return Math.abs(e) < 1e-10 ? 0 : e
    }
    function d(e, t) {
        var o = e.elements
          , s = "matrix3d(" + c(o[0]) + "," + c(o[1]) + "," + c(o[2]) + "," + c(o[3]) + "," + c(-o[4]) + "," + c(-o[5]) + "," + c(-o[6]) + "," + c(-o[7]) + "," + c(o[8]) + "," + c(o[9]) + "," + c(o[10]) + "," + c(o[11]) + "," + c(o[12]) + "," + c(o[13]) + "," + c(o[14]) + "," + c(o[15]) + ")";
        return l ? "translate(-50%,-50%)translate(" + r + "px," + n + "px)" + t + s : "translate(-50%,-50%)" + s
    }
    function p(e, t, r) {
        if (e instanceof THREE.CSS3DObject) {
            var n;
            e instanceof THREE.CSS3DSprite ? (o.copy(t.matrixWorldInverse),
            o.transpose(),
            o.copyPosition(e.matrixWorld),
            o.scale(e.scale),
            o.elements[3] = 0,
            o.elements[7] = 0,
            o.elements[11] = 0,
            o.elements[15] = 1,
            n = d(o, r)) : n = d(e.matrixWorld, r);
            var a = e.element
              , c = s.objects[e.id] && s.objects[e.id].style;
            void 0 !== c && c === n || (a.style.WebkitTransform = n,
            a.style.MozTransform = n,
            a.style.transform = n,
            s.objects[e.id] = {
                style: n
            },
            l && (s.objects[e.id].distanceToCameraSquared = S(t, e))),
            a.parentNode !== i && i.appendChild(a)
        }
        for (var m = 0, E = e.children.length; m < E; m++)
            p(e.children[m], t, r)
    }
    this.setClearColor = function() {}
    ,
    this.getSize = function() {
        return {
            width: e,
            height: t
        }
    }
    ,
    this.setSize = function(o, s) {
        r = (e = o) / 2,
        n = (t = s) / 2,
        a.style.width = o + "px",
        a.style.height = s + "px",
        i.style.width = o + "px",
        i.style.height = s + "px"
    }
    ;
    var m, E, S = (m = new THREE.Vector3,
    E = new THREE.Vector3,
    function(e, t) {
        return m.setFromMatrixPosition(e.matrixWorld),
        E.setFromMatrixPosition(t.matrixWorld),
        m.distanceToSquared(E)
    }
    );
    this.render = function(e, t) {
        var o = t.projectionMatrix.elements[5] * n;
        s.camera.fov !== o && (a.style.WebkitPerspective = o + "px",
        a.style.MozPerspective = o + "px",
        a.style.perspective = o + "px",
        s.camera.fov = o),
        e.updateMatrixWorld(),
        null === t.parent && t.updateMatrixWorld();
        var d = "translateZ(" + o + "px)" + function(e) {
            var t = e.elements;
            return "matrix3d(" + c(t[0]) + "," + c(-t[1]) + "," + c(t[2]) + "," + c(t[3]) + "," + c(t[4]) + "," + c(-t[5]) + "," + c(t[6]) + "," + c(t[7]) + "," + c(t[8]) + "," + c(-t[9]) + "," + c(t[10]) + "," + c(t[11]) + "," + c(t[12]) + "," + c(-t[13]) + "," + c(t[14]) + "," + c(t[15]) + ")"
        }(t.matrixWorldInverse)
          , m = d + "translate(" + r + "px," + n + "px)";
        s.camera.style === m || l || (i.style.WebkitTransform = m,
        i.style.MozTransform = m,
        i.style.transform = m,
        s.camera.style = m),
        p(e, t, d),
        l && function(e) {
            var t = Object.keys(s.objects).sort(function(e, t) {
                return s.objects[e].distanceToCameraSquared - s.objects[t].distanceToCameraSquared
            })
              , r = t.length;
            e.traverse(function(e) {
                var n = t.indexOf(e.id + "");
                -1 !== n && (e.element.style.zIndex = r - n)
            })
        }(e)
    }
}
;
