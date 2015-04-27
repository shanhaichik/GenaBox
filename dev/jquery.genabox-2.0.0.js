;(function ($, window, document, undefined) {
	'use strict';

	var D = $(document),
		W   = $(window),
		isTouch  = document.createTouch !== undefined,
		GB = $.genaBox = function () {
			GB.open.apply(this, arguments);
		};

	$.extend(GB, {
		defaults : {
			type:        'image',
			theme:       'image',
			overlay:     'rgba(0, 0, 0, 0.65)',
			animate:     'pulse',
			escBtn:      true,
			imgTitle:    false,
			showNav:     true,
			title:       false,
			mouseWheel:  true,
			loop       : false,
			ajax: {
				dataType: 'html',
				type: 'POST'
			},
			beforeOpen:  function(){},
			afterOpen:   function(){},
			onClick:     function(){},
			onNext:      function(){},
			onPrev:      function(){},
			ajaxSuccess: function(){},
			ajaxFail:    function(){}
		},
		theme: {
			defaults: [
				'<div class="gena-header">',
				'<div class="gena-title"></div>',
				'<div class="gena-close js-gena_close"></div>',
				'</div>',
				'<div class="gena-content"></div>'
			].join(''),

			blank: [
				'<div class="gena-content gena-bg-transparent"></div>'
			].join(''),

			image: [
				'<div class="gena-gallery-content"></div>',
				'<div class="gena-gallery-next"></div>',
				'<div class="gena-gallery-prev"></div>',
				'<div class="gena_close-top js-gena_close"></div>'
			].join('')
		},
		options: {},
		element: {},
		isShow:  false,
		overlay: null,
		container: null,
		tmp: null,
		dataHtml: null,

		/*
		 * Открытие окна
		 *
		 * @method open
		 * @param {Object} Элемент по которому кликнули
		 * @param {Object} Объект с опциями
		 */
		open: function (el, options) {
			GB.element = el;
			GB.options = $.extend(true, {}, GB.defaults, options || {}, el.html5data('gb'));
			GB.showLoading();
			GB.createOverlay();
			GB.createContainer();

			GB.container.off('.gb-close').on('click.gb-close', '.js-gena_close', function (e) {
				e.preventDefault();
				GB.close();
			});

			GB.escape();

			if(GB.element.is('a') && GB.element.attr('href')[0] === '#') {
				GB.options.type = 'inline';
			}

			if (!GB.element.data('gb-theme')
					&& (GB.options.type === 'inline' || GB.options.type === 'ajax')) {
				GB.options.theme = 'defaults';
			}

			GB[GB.options.type]();
		},

		/*
		 * Закрытие окна
		 *
		 * @method close
		 */
		close: function () {
			if (GB.options.type === 'inline') {
				GB.dataHtml.trigger('gena-insert');
			}

			GB.hideLoading();

			GB.overlay.remove();
			GB.container.remove();

			$.extend(GB, {
				isShow:    false,
				overlay:   null,
				container: null,
				tmp:       null,
				dataHtml:  null
			});
		},

		/*
		 * Создание прозрачного фона
		 *
		 * @method createOverlay
		 */
		createOverlay: function () {
			if(!GB.overlay) {
				GB.overlay = $('<div/>', {
					class: 'gena-overlay'
				}).appendTo('body').on('click', function () {
					GB.close();
				});

				GB.isShow = true;
			}
		},

		/*
		 * Создание контейнера
		 *
		 * @method createContainer
		 */
		createContainer: function () {
			if(!GB.container) {
				GB.container = $('<div/>', {
					class: 'gena-container'
				}).appendTo('body');
			}
		},

		/*
		 * Показ прелодера
		 *
		 * @method showLoading
		 */
		showLoading: function () {
			var loader, viewport;

			GB.hideLoading();

			loader = loader = $('<div/>', {
				class: 'gena-preload'
			}).appendTo('body');

			viewport = GB.getViewport();

			loader.css({
				position: 'absolute',
				top:      ((viewport.height - 20) * 0.5) + viewport.scrollTop,
				left:     ((viewport.width - 20) * 0.5) + viewport.scrollLeft
			})
		},

		/*
		 * Удаление прелодера
		 *
		 * @method hideLoading
		 */
		hideLoading: function () {
			$('.gena-preload').remove();
		},

		/*
		 * Клавиша Esc
		 *
		 * @method escape
		 */
		escape: function () {
			if (GB.isShow && !!GB.options.escBtn) {
				W.on('keyup', function (e) {
					if (e.which == 27) {
						GB.close();
					}
				});
			}
		},

		/*
		 * Выбор темы
		 *
		 * @method getTheme
		 * @return {Object} Тема
		 */
		getTheme: function (theme) {
			return GB.theme[theme || GB.options.theme];
		},

		/*
		 * Вывод инлайн блока
		 *
		 * @method inline
		 */
		inline: function () {
			var content, url = GB.element.attr('href') || '#' + GB.element.attr('id');

			GB.container.empty().append(GB.getTheme());

			GB.dataHtml = D.find('' + url + '');

			// TODO Сделать вывод ошибки
			if (GB.dataHtml.length) {
				content = GB.container.find('.gena-content');

				GB.tmp = $('<div/>', {
					class: 'gena-tmp-inline'
				});
				GB.tmp.insertBefore(GB.dataHtml);

				GB.dataHtml.off('gena-insert').on('gena-insert', function () {
					GB.dataHtml.insertBefore(GB.tmp).removeClass('gena-show-all');

					GB.tmp.remove();
				});

				GB.getTitle();

				content
					.empty()
					.append(GB.dataHtml.addClass('gena-show-all'));

				GB.hideLoading();

				GB.setPosition();
			}
		},

		/*
		 * Вывод аякс блока
		 *
		 * @method ajax
		 */
		ajax: function () {
			var content,
				url = GB.element.attr('href') || '#' + GB.element.attr('id');

			$.ajax($.extend(true, {}, GB.options.ajax, {
				url: url
			}))
				.done(function (data) {
					GB.container.empty().append(GB.getTheme());
					content = GB.container.find('.gena-content');

					GB.getTitle();

					content
						.empty()
						.append(data);

					GB.hideLoading();

					GB.setPosition();
				})
				.fail(function (err) {
					console.log(err);
				})
				.always(function () {

					if (GB.isShow && GB.tmp) {
						GB.dataHtml.insertBefore(GB.tmp).removeClass('gena-show-all');
						GB.tmp.remove();

						$.extend(GB, {
							tmp:       null,
							dataHtml:  null
						});
					}
				});
		},

		/*
		 * Вывод изображения (галереи)
		 *
		 * @method image
		 */
		image: function () {
			var isGallery = GB.element.data('gb-gall') || false;

			var items = (isGallery) ? D.find('a[data-gb-gall=' + isGallery + ']') : GB.element,
				index = items.index(GB.element);

			var prev, next, gallery;

			GB.container.empty().append(GB.getTheme());

			gallery = GB.container.find('.gena-gallery-content');

			prev = GB.container.find('.gena-gallery-prev');
			next = GB.container.find('.gena-gallery-next');

			loadImage(GB.element, index);

			if (items.length > 1 && !("ontouchstart" in window)) {
				prev.add(next).show();

				prev.on('click', showPrev);
				next.on('click', showNext);
			}

			if (("ontouchstart" in window)) {
				gallery.on('touchstart', 'img', function (e) {
					var touch = e.originalEvent
						, startX = touch.changedTouches[0].pageX;

					gallery.on('touchmove', function (e) {
						e.preventDefault();
						touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];

						if (touch.pageX - startX > 10) {
							gallery.off('touchmove');
							showPrev();
						}
						else if (touch.pageX - startX < -10) {
							gallery.off('touchmove');
							showNext();
						}
					});

					return false;

				}).on('touchend', function () {
					gallery.off('touchmove');
				});
			}

			if ($.fn.mousewheel && GB.options.mouseWheel) {
				gallery.on('mousewheel next.gb.image prev.gb.image', function (e, side) {
					e.preventDefault();
					(side > 0) ? showNext() : showPrev();
				});
			}

			// TODO Зацикливание картинок, нужно подумать как по другому переписать
			function showPrev() {
				if (GB.options.loop) {
					index--;
					if ( index < 0 ) {
						index = items.length - 1;
					}
					loadImage(items.eq(index), index);
				} else {
					if ( index > 0 ) {
						index--;
						loadImage(items.eq(index), index);
					}
				}
			}

			function showNext() {
				if (GB.options.loop) {
					index++;
					if ( index > items.length - 1 ) {
						index = 0;
					}
					loadImage(items.eq(index), index);
				} else {
					if (index + 1 < items.length) {
						index++;
						loadImage(items.eq(index), index);
					}
				}

			}

			function loadImage(el, index) {
				if (index < 0 || index >= items.length) {
					return false;
				}

				var image = new Image();

				image.onload = function () {
					var container, size;

					size = getZoomSize.apply(image);

					container = GB.container.find('.gena-gallery-content');
					container.css({
						'width' : size.width,
						'height' : size.height
					}).empty().append(image);

					GB.hideLoading();
					GB.setPosition();

					image = null;
				};

				image.src = el.attr('href');

				if (image.complete !== true) {
					GB.showLoading();
				}
			}

			function getZoomSize() {
				var viewport,
					ratio,
					size = {};

				size.width = parseInt(this.width, 10);
				size.height = parseInt(this.height, 10);

				viewport = GB.getViewport();

				if (size.width > viewport.width || size.height > viewport.height) {
					ratio = size.width / size.height;

					if (size.width > viewport.width) {
						size.width = viewport.width;
						size.height = parseInt(size.width / ratio, 10);
					}

					if (size.height > viewport.height) {
						size.height = viewport.height;
						size.width = parseInt(size.height * ratio, 10);
					}
				}

				return size;
			}
		},

		/*
		 * Установка заголовка
		 *
		 * @method getTitle
		 */
		getTitle: function () {
			if (GB.options.title) {
				GB.container.find('.gena-title')
					.empty()
					.html(GB.options.title);
			}
		},

		/*
		 * Получение значений области просмотра окна браузера
		 *
		 * @method getViewport
		 * @return {Object} Числовые значения, скрола сверху и слева, а также ширина и высота окна браузера
		 */
		getViewport: function () {
			return {
				scrollTop: W.scrollTop(),
				scrollLeft: W.scrollLeft(),
				width: isTouch && window.innerWidth  ? window.innerWidth  : W.width(),
				height: isTouch && window.innerHeight ? window.innerHeight : W.height()
			};
		},

		/*
		 * Центровка окна
		 *
		 * @method setPosition
		 */
		setPosition: function () {
			var viewport, top,
				container = GB.container;

			viewport = GB.getViewport();
			top = ((viewport.height - container.height() - 20) * 0.5) + viewport.scrollTop;

			container.css({
				top:  (top > 0) ? top : viewport.scrollTop,
				left: ((viewport.width - container.width() - 20) * 0.5) + viewport.scrollLeft
			})
		}
	});

	$.fn.genaBox = function (options) {
		var _self = $(this);

		_self.off('click.gb-start').on('click.gb-start', function (e) {
			if (GB.open($(this), options) !== false) {
				e.preventDefault();
			}
		});

		if (typeof options == 'string' && options == 'show') {
			var delay = _self.data('gb-delay');

			if (!delay) {
				_self.trigger('click');
			} else {
				window.setTimeout(function () {
					_self.trigger('click');
				}, delay);
			}
		}

		return this;
	};

	D.ready(function() {
		D.on('click', '[data-gb-show]', function (e) {
			e.preventDefault();
			$.genaBox.open($(this));
		});
	});

})(jQuery, window, document);

/*
 * $.html5data v1.0
 * Copyright 2011, Mark Dalgleish
 *
 * This content is released under the MIT License
 * github.com/markdalgleish/jquery-html5data/blob/master/MIT-LICENSE.txt
 */
!function(a,b){a.fn.html5data=function(c,d){var e={parseBooleans:!0,parseNumbers:!0,parseNulls:!0,parseJSON:!0,parse:b},f=a.extend({},e,d),g=[],h="data-"+(c?c+"-":""),i=function(b){var c=b.toLowerCase(),d=b.charAt(0);return f.parseBooleans===!0&&c==="true"?!0:f.parseBooleans===!0&&c==="false"?!1:f.parseNulls===!0&&c==="null"?null:f.parseNumbers===!0&&!isNaN(b*1)?b*1:f.parseJSON===!0&&d==="["||d==="{"?a.parseJSON(b):typeof f.parse=="function"?f.parse(b):b};this.each(function(){var a={},b,c,d;for(var e=0,f=this.attributes.length;e<f;e++){b=this.attributes[e];if(b.name.indexOf(h)===0){d="",c=b.name.replace(h,"").split("-");for(var j=0,k=c.length;j<k;j++)d+=j===0?c[j].toLowerCase():c[j].charAt(0).toUpperCase()+c[j].slice(1).toLowerCase();a[d]=i(b.value)}}g.push(a)});return g.length===1?g[0]:g},a.html5data=function(b,c,d){return a(b).html5data(c,d)}}(jQuery);

/*! Copyright (c) 2013 Brandon Aaron (http://brandon.aaron.sh)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Version: 3.1.12
 *
 * Requires: jQuery 1.2.2+
 */
!function(a){"function"==typeof define&&define.amd?define(["jquery"],a):"object"==typeof exports?module.exports=a:a(jQuery)}(function(a){function b(b){var g=b||window.event,h=i.call(arguments,1),j=0,l=0,m=0,n=0,o=0,p=0;if(b=a.event.fix(g),b.type="mousewheel","detail"in g&&(m=-1*g.detail),"wheelDelta"in g&&(m=g.wheelDelta),"wheelDeltaY"in g&&(m=g.wheelDeltaY),"wheelDeltaX"in g&&(l=-1*g.wheelDeltaX),"axis"in g&&g.axis===g.HORIZONTAL_AXIS&&(l=-1*m,m=0),j=0===m?l:m,"deltaY"in g&&(m=-1*g.deltaY,j=m),"deltaX"in g&&(l=g.deltaX,0===m&&(j=-1*l)),0!==m||0!==l){if(1===g.deltaMode){var q=a.data(this,"mousewheel-line-height");j*=q,m*=q,l*=q}else if(2===g.deltaMode){var r=a.data(this,"mousewheel-page-height");j*=r,m*=r,l*=r}if(n=Math.max(Math.abs(m),Math.abs(l)),(!f||f>n)&&(f=n,d(g,n)&&(f/=40)),d(g,n)&&(j/=40,l/=40,m/=40),j=Math[j>=1?"floor":"ceil"](j/f),l=Math[l>=1?"floor":"ceil"](l/f),m=Math[m>=1?"floor":"ceil"](m/f),k.settings.normalizeOffset&&this.getBoundingClientRect){var s=this.getBoundingClientRect();o=b.clientX-s.left,p=b.clientY-s.top}return b.deltaX=l,b.deltaY=m,b.deltaFactor=f,b.offsetX=o,b.offsetY=p,b.deltaMode=0,h.unshift(b,j,l,m),e&&clearTimeout(e),e=setTimeout(c,200),(a.event.dispatch||a.event.handle).apply(this,h)}}function c(){f=null}function d(a,b){return k.settings.adjustOldDeltas&&"mousewheel"===a.type&&b%120===0}var e,f,g=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],h="onwheel"in document||document.documentMode>=9?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],i=Array.prototype.slice;if(a.event.fixHooks)for(var j=g.length;j;)a.event.fixHooks[g[--j]]=a.event.mouseHooks;var k=a.event.special.mousewheel={version:"3.1.12",setup:function(){if(this.addEventListener)for(var c=h.length;c;)this.addEventListener(h[--c],b,!1);else this.onmousewheel=b;a.data(this,"mousewheel-line-height",k.getLineHeight(this)),a.data(this,"mousewheel-page-height",k.getPageHeight(this))},teardown:function(){if(this.removeEventListener)for(var c=h.length;c;)this.removeEventListener(h[--c],b,!1);else this.onmousewheel=null;a.removeData(this,"mousewheel-line-height"),a.removeData(this,"mousewheel-page-height")},getLineHeight:function(b){var c=a(b),d=c["offsetParent"in a.fn?"offsetParent":"parent"]();return d.length||(d=a("body")),parseInt(d.css("fontSize"),10)||parseInt(c.css("fontSize"),10)||16},getPageHeight:function(b){return a(b).height()},settings:{adjustOldDeltas:!0,normalizeOffset:!0}};a.fn.extend({mousewheel:function(a){return a?this.bind("mousewheel",a):this.trigger("mousewheel")},unmousewheel:function(a){return this.unbind("mousewheel",a)}})});
