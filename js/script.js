/*
  Author: Yuval Greenfield (http://uberpython.wordpress.com)
  Modifier to E621P: SilentDeath1 (https://github.com/SilentDeath1/e621p)

  You can save the HTML file and use it locally btw like so:
    file:///wherever/index.html?tags=wolf

  Favicon by Double-J designs http://www.iconfinder.com/icondetails/68600/64/_icon
  HTML based on http://demo.marcofolio.net/fullscreen_image_slider/
  Author of slideshow base :      Marco Kuiper (http://www.marcofolio.net/)
*/

// TODO: refactor all the globals to use the ep object's namespace.
var ep = {};
ep.debug = true;

// Speed of the animation
var animationSpeed = 1000;
var shouldAutoNextSlide = true;
var timeToNextSlide = 6 * 1000;
var cookieDays = 300;

// These vars are used for AJAX Url.
var e621pTags = '';
var e621pLimit = 10;
var e621pPageNumber = 1;
var e621pRating = '';

var e621pDescending = true;
var e621pAfterId = 0;

// These variables are used to decide if there is more data from the API.
var e621pFailedImageNumber = 0;
var e621pSuccessImageNumber = 0;

// Variable to store the images we need to set as background
// which also includes some text and url's.
ep.photos = [];

// 0-based index to set which picture to show first
// init to -1 until the first image is loaded
var activeIndex = -1;


// IE doesn't have indexOf, wtf...
if (!Array.indexOf) {
    Array.prototype.indexOf = function (obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == obj) {
                return i;
            }
        }
        return -1;
    };
}

// IE doesn't have console.log and fails, wtf...
// usage: log('inside coolFunc',this,arguments);
// http://paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function () {
    log.history = log.history || []; // store logs to an array for reference
    log.history.push(arguments);
    if (this.console) {
        console.log(Array.prototype.slice.call(arguments));
    }
};

$(function () {

    $("#subredditUrl").text("Loading E621 Slideshow");
    $("#navboxTitle").text("Loading E621 Slideshow");

    //Get Query Variables From URL.

    if(getQueryVariable("tags")== '' /*|| (typeof getQueryVariable("tags")) != "string"*/){
			e621pTags = '';
      console.log('You can search specific tags by specifying ?tags= in the URL e.g. /?tags=wolf&page=1&limit=10');
		}else{
			e621pTags = getQueryVariable("tags");
		}

		if(getQueryVariable("page")== 0 /*|| (typeof getQueryVariable("page")) != "number"*/){
			e621pPageNumber = 1;
      console.log('You can select a specific page for results by specifying ?page= in the URL e.g. /?tags=wolf&page=1&limit=10');
		}else{
			e621pPageNumber = getQueryVariable("page");
		}

    if(getQueryVariable("limit")== 0 /*|| ((typeof getQueryVariable("limit")) != "number")*/){
			e621pLimit = 5;
      console.log('You can specify images per load cycle by specifying ?limit= in the URL e.g. /?tags=wolf&page=1&limit=10');
		}else{
			e621pLimit = getQueryVariable("limit");
		}

    fadeoutWhenIdle = true;
    var setupFadeoutOnIdle = function () {
        $('.fadeOnIdle').fadeTo('fast', 0);
        var navboxVisible = false;
        var fadeoutTimer = null;
        var fadeoutFunction = function () {
            navboxVisible = false;
            if (fadeoutWhenIdle) {
                $('.fadeOnIdle').fadeTo('slow', 0);
            }
        };
        $("body").mousemove(function () {
            if (navboxVisible) {
                clearTimeout(fadeoutTimer);
                fadeoutTimer = setTimeout(fadeoutFunction, 2000);
                return;
            }
            navboxVisible = true;
            $('.fadeOnIdle').fadeTo('fast', 1);
            fadeoutTimer = setTimeout(fadeoutFunction, 2000);
        });
    };
    // this fadeout was really inconvenient on mobile phones
    // and instead the minimize buttons should be used.
    //setupFadeoutOnIdle();

    var nextSlideTimeoutId = null;

    var loadingNextImages = false;

    function nextSlide() {
        if(!nsfw) {
            for(var i = activeIndex + 1; i < ep.photos.length; i++) {
                if (!ep.photos[i].over18) {
                    return startAnimation(i);
                }
            }
        }
        if (isLastImage(activeIndex) && !loadingNextImages) {
            // the only reason we got here and there aren't more pictures yet
            // is because there are no more images to load, start over
            return startAnimation(0);
        }
        startAnimation(activeIndex + 1);
    }
    function prevSlide() {
        if(!nsfw) {
            for(var i = activeIndex - 1; i > 0; i--) {
                if (!ep.photos[i].over18) {
                    return startAnimation(i);
                }
            }
        }
        startAnimation(activeIndex - 1);
    }


    var autoNextSlide = function () {
        if (shouldAutoNextSlide) {
            // startAnimation takes care of the setTimeout
            nextSlide();
        }
    };

    function getQueryVariable(variable) {
        const url = new URL(window.location)
        const value = url.searchParams.get(variable)
        return value || false
     }

    function open_in_background(selector){
        // as per https://developer.mozilla.org/en-US/docs/Web/API/event.initMouseEvent
        // works on latest chrome, safari and opera
        var link = $(selector)[0];

        // Simulating a ctrl key won't trigger a background tab on IE and Firefox ( https://bugzilla.mozilla.org/show_bug.cgi?id=812202 )
        // so we need to open a new window
        if ( navigator.userAgent.match(/msie/i) || navigator.userAgent.match(/trident/i)  || navigator.userAgent.match(/firefox/i) ){
            window.open(link.href,'_blank');
        } else {
            var mev = document.createEvent("MouseEvents");
            mev.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, true, false, false, true, 0, null);
            link.dispatchEvent(mev);
        }
    }

    $("#pictureSlider").touchwipe({
        // wipeLeft means the user moved his finger from right to left.
        wipeLeft: function () {
            nextSlide();
        },
        wipeRight: function () {
            prevSlide();
        },
        wipeUp: function () {
            nextSlide();
        },
        wipeDown: function () {
            prevSlide();
        },
        min_move_x: 20,
        min_move_y: 20,
        preventDefaultEvents: false
    });

    var OPENSTATE_ATTR = "data-openstate";
    $('.collapser').click(function () {
        var state = $(this).attr(OPENSTATE_ATTR);
        if (state == "open") {
            // close it
            $(this).text("+");
            // move to the left just enough so the collapser arrow is visible
            var arrowLeftPoint = $(this).position().left;
            $(this).parent().animate({
                left: "-" + arrowLeftPoint + "px"
            });
            $(this).attr(OPENSTATE_ATTR, "closed");
        } else {
            // open it
            $(this).text("-");
            $(this).parent().animate({
                left: "0px"
            });
            $(this).attr(OPENSTATE_ATTR, "open");
        }
    });

    // maybe checkout http://engineeredweb.com/blog/09/12/preloading-images-jquery-and-javascript/ for implementing the old precache
    var cache = [];
    // Arguments are image paths relative to the current page.
    var preLoadImages = function () {
        var args_len = arguments.length;
        for (var i = args_len; i--;) {
            var cacheImage = document.createElement('img');
            cacheImage.src = arguments[i];
            cache.push(cacheImage);
        }
    };

    var setCookie = function (c_name, value, exdays) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value = escape(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
        document.cookie = c_name + "=" + c_value;
    };

    var getCookie = function (c_name) {
        var i, x, y;
        var cookiesArray = document.cookie.split(";");
        for (i = 0; i < cookiesArray.length; i++) {
            x = cookiesArray[i].substr(0, cookiesArray[i].indexOf("="));
            y = cookiesArray[i].substr(cookiesArray[i].indexOf("=") + 1);
            x = x.replace(/^\s+|\s+$/g, "");
            if (x == c_name) {
                return unescape(y);
            }
        }
    };

    var resetNextSlideTimer = function () {
        clearTimeout(nextSlideTimeoutId);
        nextSlideTimeoutId = setTimeout(autoNextSlide, timeToNextSlide);
    };

    shouldAutoNextSlideCookie = "shouldAutoNextSlideCookie";
    var updateAutoNext = function () {
        shouldAutoNextSlide = $("#autoNextSlide").is(':checked');
        setCookie(shouldAutoNextSlideCookie, shouldAutoNextSlide, cookieDays);
        resetNextSlideTimer();
    };

    var toggleFullScreen = function() {
        var elem = document.getElementById('page');
        if (document.fullscreenElement || // alternative standard method
            document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) { // current working methods
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } else {
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        }
    };

    var nsfwCookie = "nsfwCookie";
    var updateNsfw = function () {
        nsfw = $("#nsfw").is(':checked');
        setCookie(nsfwCookie, nsfw, cookieDays);
    };

    var orderCookie = "orderCookie";
    var updateOrder = function () {
        e621pDescending = $("#descending").is(':checked');
        setCookie(orderCookie, e621pDescending, cookieDays);
    };

    var initState = function () {
        var nsfwByCookie = getCookie(nsfwCookie);
        if (nsfwByCookie == undefined) {
            // default to SFW (nsfw = false) for safer default behavior
            nsfw = false;
            $("#nsfw").prop("checked", nsfw);
        } else {
            nsfw = (nsfwByCookie === "true");
            $("#nsfw").prop("checked", nsfw);
        }
        $('#nsfw').change(updateNsfw);

        var orderByCookie = getCookie(nsfwCookie);
        if (orderByCookie == undefined) {
            e621pDescending = true;
        } else {
            e621pDescending = (orderByCookie === "true");
            $("#descending").prop("checked", e621pDescending);
        }
        $('#descending').change(updateOrder);


        var autoByCookie = getCookie(shouldAutoNextSlideCookie);
        if (autoByCookie == undefined) {
            updateAutoNext();
        } else {
            shouldAutoNextSlide = (autoByCookie === "true");
            $("#autoNextSlide").prop("checked", shouldAutoNextSlide);
        }
        $('#autoNextSlide').change(updateAutoNext);

        var updateTimeToNextSlide = function () {
            var val = $('#timeToNextSlide').val();
            timeToNextSlide = parseFloat(val) * 1000;
            setCookie(timeToNextSlideCookie, val, cookieDays);
        };

        var timeToNextSlideCookie = "timeToNextSlideCookie";
        timeByCookie = getCookie(timeToNextSlideCookie);
        if (timeByCookie == undefined) {
            updateTimeToNextSlide();
        } else {
            timeToNextSlide = parseFloat(timeByCookie) * 1000;
            $('#timeToNextSlide').val(timeByCookie);
        }

        $('#fullScreenButton').click(toggleFullScreen);

        $('#timeToNextSlide').keyup(updateTimeToNextSlide);

        $('#prevButton').click(prevSlide);
        $('#nextButton').click(nextSlide);
    };

    var addNumberButton = function (numberButton) {
        var navboxUls = $(".navbox ul");
        var thisNavboxUl = navboxUls[navboxUls.length - 1];

        var newListItem = $("<li />").appendTo(thisNavboxUl);
        numberButton.appendTo(newListItem);

        // so li's have a space between them and can word-wrap in the box
        navboxUls.append(document.createTextNode(' '));
    };

    var addImageSlide = function (pic) {
        /*
        var pic = {
            "title": title,
            "url": url,
            "commentsLink": commentsLink,
            "over18": over18,
            "isVideo": video
        }
        */
        pic.isVideo = false;
        if (pic.url.indexOf('gfycat.com') >= 0 | (pic.url.substr(pic.url.lastIndexOf('.')+1)) == "webm"){
            pic.isVideo = true;
            e621pSuccessImageNumber++;
        } else if (isImageExtension(pic.url)) {
            // simple image
            e621pSuccessImageNumber++;
        } else {
            var betterUrl = tryConvertUrl(pic.url);
            if(betterUrl !== '') {
                pic.url = betterUrl;
                e621pSuccessImageNumber++;
            } else {
                if (ep.debug) {
                    reason = ('Picture isn\'t a usable format.');
                    console.log('Failed: ' + pic.url + ' Reason: ' + reason);
                    e621pFailedImageNumber++;
                }
                return;
            }
        }

        ep.foundOneImage = true;

        preLoadImages(pic.url);
        ep.photos.push(pic);

        var i = ep.photos.length - 1;
        var numberButton = $("<a />").html(i + 1)
            .data("index", i)
            .attr("title", ep.photos[i].title)
            .attr("id", "numberButton" + (i + 1));
        if(pic.over18) {
            numberButton.addClass("over18");
        }
        numberButton.click(function () {
            showImage($(this));
        });
        numberButton.addClass("numberButton");
        addNumberButton(numberButton);
    };

    var arrow = {
        left: 37,
        up: 38,
        right: 39,
        down: 40
    };
    var ONE_KEY = 49;
    var NINE_KEY = 57;
    var SPACE = 32;
    var PAGEUP = 33;
    var PAGEDOWN = 34;
    var ENTER = 13;
    var A_KEY = 65;
    var C_KEY = 67;
    var F_KEY = 70;
    var I_KEY = 73;
    var R_KEY = 82;
    var T_KEY = 84;


    // Register keyboard events on the whole document
    $(document).keyup(function (e) {
        // Hotkey help modal logic
        var showHotkeyHelp = function() {
            var modal = document.getElementById('hotkeyHelpModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.focus();
            }
        };
        var hideHotkeyHelp = function() {
            var modal = document.getElementById('hotkeyHelpModal');
            if (modal) {
                modal.classList.add('hidden');
            }
        };
        // Show help on '?' or 'h' (ignore if typing in input)
        var active = document.activeElement;
        if (active && (active.id === 'tagSearch' || $(active).closest('#tagSearch').length)) {
            return;
        }
        if (e.key === '?' || e.key === 'h' || e.key === 'H') {
            showHotkeyHelp();
            return;
        }
        if (e.key === 'Escape') {
            hideHotkeyHelp();
            return;
        }
        if(e.ctrlKey) {
            // ctrl key is pressed so we're most likely switching tabs or doing something
            // unrelated to redditp UI
            return;
        }

        //log(e.keyCode, e.which, e.charCode);

        // 37 - left
        // 38 - up
        // 39 - right
        // 40 - down
        // More info: http://stackoverflow.com/questions/302122/jquery-event-keypress-which-key-was-pressed
        // http://stackoverflow.com/questions/1402698/binding-arrow-keys-in-js-jquery
        var code = (e.keyCode ? e.keyCode : e.which);

        switch (code) {
            case C_KEY:
                $('#controlsDiv .collapser').click();
                break;
            case T_KEY:
                $('#titleDiv .collapser').click();
                break;
            case A_KEY:
                $("#autoNextSlide").prop("checked", !$("#autoNextSlide").is(':checked'));
                updateAutoNext();
                break;
            case I_KEY:
                open_in_background("#navboxLink");
                break;
            case R_KEY:
                open_in_background("#navboxCommentsLink");
                break;
            case F_KEY:
                toggleFullScreen();
                break;
            case PAGEUP:
            case arrow.left:
            case arrow.up:
                return prevSlide();
            case PAGEDOWN:
            case arrow.right:
            case arrow.down:
            case SPACE:
                return nextSlide();
        }
    });

    // Random slide helper (respects nsfw setting)
    var showRandomSlide = function () {
        if (ep.photos.length === 0) {
            // If no photos yet, trigger a load and then pick random after a short delay
            getRedditImages();
            setTimeout(function () {
                if (ep.photos.length === 0) return;
                var candidates = [];
                for (var i = 0; i < ep.photos.length; i++) {
                    if (!ep.photos[i].over18 || nsfw) candidates.push(i);
                }
                if (candidates.length === 0) return;
                var idx = candidates[Math.floor(Math.random() * candidates.length)];
                startAnimation(idx);
            }, 1000);
            return;
        }

        var candidates = [];
        for (var i = 0; i < ep.photos.length; i++) {
            if (!ep.photos[i].over18 || nsfw) candidates.push(i);
        }
        if (candidates.length === 0) return;
        var idx = candidates[Math.floor(Math.random() * candidates.length)];
        startAnimation(idx);
    };

    // Close hotkey help with button
    $(document).on('click', '#closeHotkeyHelp', function() {
        var modal = document.getElementById('hotkeyHelpModal');
        if (modal) modal.classList.add('hidden');
    });


    //
    // Shows an image and plays the animation
    //
    var showImage = function (docElem) {
        // Retrieve the index we need to use
        var imageIndex = docElem.data("index");

        startAnimation(imageIndex);
    };

    var isLastImage = function(imageIndex) {
        if(nsfw) {
            if(imageIndex == ep.photos.length - 1) {
                return true;
            } else {
                return false;
            }
        } else {
            // look for remaining sfw images
            for(var i = imageIndex + 1; i < ep.photos.length; i++) {
                if(!ep.photos[i].over18) {
                    return false;
                }
            }
            return true;
        }
    };
    //
    // Starts the animation, based on the image index
    //
    // Variable to store if the animation is playing or not
    var isAnimating = false;
    var startAnimation = function (imageIndex) {
        resetNextSlideTimer();

        // If the same number has been chosen, or the index is outside the
        // ep.photos range, or we're already animating, do nothing
        if (activeIndex == imageIndex || imageIndex > ep.photos.length - 1 || imageIndex < 0 || isAnimating || ep.photos.length == 0) {
            return;
        }

        isAnimating = true;
        animateNavigationBox(imageIndex);
        slideBackgroundPhoto(imageIndex);

        // Set the active index to the used image index
        activeIndex = imageIndex;

        if (isLastImage(activeIndex) && ep.subredditUrl.indexOf('/imgur') != 0) {
            // e621pPageNumber++;
            // Load more images when we reach the end of the loaded set
            getRedditImages();


        }
        // Handle search
$("#searchBtn").click(function () {
    let tags = $("#tagSearch").val().trim();
    if (tags.length === 0) return;

    // Update tags for API
    e621pTags = tags.replace(/\s+/g, "+"); 

    // Reset state
    e621pAfterId = 0;
    ep.photos = [];
    activeIndex = -1;

    // Remove only old slides, keep placeholder div
    $("#pictureSlider").html("<div></div>");

    // Clear only the number buttons, not the whole navbox
    $("#allNumberButtons").empty();
    $("#sfwNumberButtons").empty();

    // Reload new images
    getRedditImages();
});

// Allow pressing Enter
$("#tagSearch").keypress(function (e) {
    if (e.which === 13) {
        $("#searchBtn").click();
    }
});

    };

    var toggleNumberButton = function (imageIndex, turnOn) {
        var numberButton = $('#numberButton' + (imageIndex + 1));
        if (turnOn) {
            numberButton.addClass('active');
        } else {
            numberButton.removeClass('active');
        }
    };

    //
    // Animate the navigation box
    //
    var animateNavigationBox = function (imageIndex) {
        var photo = ep.photos[imageIndex];
        var subreddit = '/r/' + photo.subreddit;

        $('#navboxTitle').html(photo.title);
        //$('#navboxSubreddit').attr('href', ep.redditBaseUrl + subreddit).html(subreddit);
        $('#navboxLink').attr('href', photo.url).attr('title', photo.title);
        $('#navboxCommentsLink').attr('href', photo.commentsLink).attr('title', "Comments on e621");

        toggleNumberButton(activeIndex, false);
        toggleNumberButton(imageIndex, true);
    };

    //
    // Slides the background photos
    //
    var slideBackgroundPhoto = function (imageIndex) {

        // Retrieve the accompanying photo based on the index
        var photo = ep.photos[imageIndex];

        // Create a new div and apply the CSS
        var cssMap = Object();
        cssMap['display'] = "none";
        if(!photo.isVideo) {
            cssMap['background-image'] = "url(" + photo.url + ")";
            cssMap['background-repeat'] = "no-repeat";
            cssMap['background-size'] = "contain";
            cssMap['background-position'] = "center";
        }

        //var imgNode = $("<img />").attr("src", photo.image).css({opacity:"0", width: "100%", height:"100%"});
        var divNode = $("<div />").css(cssMap).addClass("clouds");
        if(photo.isVideo & photo.url.indexOf('gfycat.com') >= 0) {
            clearTimeout(nextSlideTimeoutId);
            var gfyid = photo.url.substr(1 + photo.url.lastIndexOf('/'));
            if(gfyid.indexOf('#') != -1)
                gfyid = gfyid.substr(0, gfyid.indexOf('#'));
            divNode.html('<img class="gfyitem" data-id="'+gfyid+'" data-controls="false"/>');
        }
        if(photo.isVideo & photo.url.indexOf('gfycat.com') >= 0 | (photo.url.substr(photo.url.lastIndexOf('.')+1)) == "webm"){
          //console.log("correct");
          divNode.html('<video autoplay class="webm" width="100%" height="100%" onended="slideNext()" controls> <source src="'+photo.url+'"type="video/webm"></video>');
        }

        //imgNode.appendTo(divNode);
        divNode.prependTo("#pictureSlider");

        $("#pictureSlider div").fadeIn(animationSpeed);
        if(photo.isVideo & photo.url.indexOf('gfycat.com') >= 0){
          //console.log("giffy");
            gfyCollection.init();
            //ToDo: find a better solution!
            $(divNode).bind("DOMNodeInserted", function(e) {
                if(e.target.tagName.toLowerCase() == "video") {
                    var vid = $('.gfyitem > div').width('100%').height('100%');
                    vid.find('.gfyPreLoadCanvas').remove();
                    var v = vid.find('video').width('100%').height('100%');
                    vid.find('.gfyPreLoadCanvas').remove();
                    if (shouldAutoNextSlide)
                        v.removeAttr('loop');
                    v[0].onended = function (e) {
                        if (shouldAutoNextSlide){
                          setTimeout(function(){nextSlide();},500);
                        }

                    };
                }
            });
        }else{
          $(divNode).bind("DOMNodeInserted", function(e) {
               var vid = $('#pictureSlider > div > video');
               var v = vid[0];
               v[0].onended = function (e) {
                 if (shouldAutoNextSlide)
                     nextSlide();
                   };
               });
        }

        var oldDiv = $("#pictureSlider div:not(:first)");
        oldDiv.fadeOut(animationSpeed, function () {
            oldDiv.remove();
            isAnimating = false;
        });

    };



    var verifyNsfwMakesSense = function() {
        // Cases when you forgot NSFW off but went to /r/nsfw
        // can cause strange bugs, let's help the user when over 80% of the
        // content is NSFW.
        var nsfwImages = 0;
        for(var i = 0; i < ep.photos.length; i++) {
            if(ep.photos[i].over18) {
                nsfwImages += 1;
            }
        }

        if(0.8 < nsfwImages * 1.0 / ep.photos.length) {
            nsfw = true;
            $("#nsfw").prop("checked", nsfw);
        }
    };


    var tryConvertUrl = function (url) {
        if (url.indexOf('imgur.com') > 0 || url.indexOf('/gallery/') > 0) {
            // special cases with imgur

            if (url.indexOf('gifv') >= 0) {
                if (url.indexOf('i.') === 0) {
                    url = url.replace('imgur.com', 'i.imgur.com');
                }
                return url.replace('.gifv', '.gif');
            }

            if (url.indexOf('/a/') > 0 || url.indexOf('/gallery/') > 0) {
                // albums aren't supported yet
                //console.log('Unsupported gallery: ' + url);
                return '';
            }

            // imgur is really nice and serves the image with whatever extension
            // you give it. '.jpg' is arbitrary
            // regexp removes /r/<sub>/ prefix if it exists
            // E.g. http://imgur.com/r/aww/x9q6yW9
            return url.replace(/r\/[^ \/]+\/(\w+)/, '$1') + '.jpg';
        }

        return '';
    };
    var goodExtensions = ['.jpg', '.jpeg', '.gif', '.bmp', '.png','.webm'];
    var isImageExtension = function (url) {
        var dotLocation = url.lastIndexOf('.');
        if (dotLocation < 0) {
            log("skipped no dot: " + url);
            return false;
        }
        var extension = url.substring(dotLocation);

        if (goodExtensions.indexOf(extension) >= 0) {
            return true;
        } else {
            //log("skipped bad extension: " + url);
            return false;
        }
    };

    var decodeUrl = function (url) {
        return decodeURIComponent(url.replace(/\+/g, " "));
    };
    ep.getRestOfUrl = function () {
        // Separate to before the question mark and after
        // Detect predefined reddit url paths. If you modify this be sure to fix
        // .htaccess
        // This is a good idea so we can give a quick 404 page when appropriate.

        var regexS = "(/(?:(?:r/)|(?:imgur/a/)|(?:user/)|(?:domain/)|(?:search))[^&#?]*)[?]?(.*)";
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        //log(results);
        if (results === null) {
            return ["", ""];
        } else {
            return [results[1], decodeUrl(results[2])];
        }
    };

    var failCleanup = function() {
        if (ep.photos.length > 0) {
            // already loaded images, don't ruin the existing experience
            return;
        }

        // remove "loading" title
        $('#navboxTitle').text('');

        // display alternate recommendations
        $('#recommend').css({'display':'block'});
    };

    var getRedditImages = function () {
        //if (noMoreToLoad){
        //    log("No more images to load, will rotate to start.");
        //    return;
        //}

        loadingNextImages = true;
        e621pFailedImageNumber = 0;
        e621pSuccessImageNumber = 0;

        //Checks what the NSFW tag is and sets the image rating
        if(nsfw){
            e621pRating = "rating:e";
            //Leaving out questionable from NSFW -- If Wanting questionable in NSFW uncomment line below
            //rating = rating+"+rating:q";
        }else{
            e621pRating = "rating:s";
            //Leading out questinable from SFW -- If Wanting questionable in SFW uncomment line below
            //rating = rating+"+rating:q";
        }

        var jsonUrl = "https://e621.net/posts.json?tags="+e621pRating+"+"+e621pTags +"&limit="+ e621pLimit+`&page=${e621pAfterId != 0 ? (e621pDescending ? "b": "a") : ("") }`+e621pAfterId;
        //console.log(jsonUrl);
        //log(jsonUrl);
        // non-blocking status helper
        var showStatus = function(msg, timeout) {
            var el = document.getElementById('statusMessage');
            if (!el) return;
            el.textContent = msg;
            el.classList.remove('hidden');
            if (timeout && timeout > 0) {
                setTimeout(function(){ el.classList.add('hidden'); }, timeout);
            }
        };

        var failedAjax = function (jqXHR, textStatus, errorThrown) {
            console.warn('AJAX failed', textStatus, errorThrown);
            // show a non-blocking status and attempt retries (handled below)
            showStatus('Network error — retrying...', 3000);
            failCleanup();
        };
        var retryCount = 0;
        var maxRetries = 3;
        var retryDelayBase = 800; // ms
        var handleData = function (data) {
            //redditData = data //global for debugging data
            // NOTE: if data.data.after is null then this causes us to start
            // from the top on the next getRedditImages which is fine.
            // after = "&after=" + data.data.after;

            returnJson = data;

            console.log(data)

            if (!returnJson || returnJson.posts === undefined || returnJson.posts.length === 0) {
                console.warn('Empty data from API', returnJson);
                // If we haven't retried yet, try again before giving up
                if (retryCount < maxRetries) {
                    retryCount++;
                    var delay = retryDelayBase * Math.pow(2, retryCount - 1);
                    showStatus('Received empty data — retrying...', 2000);
                    setTimeout(getRedditImages, delay);
                    return;
                }
                showStatus('No data available.', 4000);
                return;
            }

            $.each(returnJson.posts, function (i, item) {
                console.log(i, item)
                if(item.rating == "e" | item.rating == "q"){
                    isOver18 = true;
                }else{
                    isOver18 = false;
                }

                //Prime AfterID
                if(e621pAfterId === 0) e621pAfterId = item.id

                if(e621pDescending){
                    if(item.id < e621pAfterId){
                        e621pAfterId = item.id
                    }
                }else{
                    if(item.id > e621pAfterId){
                        e621pAfterId = item.id
                    }
                }
                if(item.file.url == null){
                    //Item has been deleted, continue.
                    return
                }
                
                addImageSlide({
                    url: item.file.url,
                    title: item.tags.artist,
                    over18: isOver18,
                    subreddit: "",
                    commentsLink: "https://e621.net/post/show/" + item.id
                });
            });

            verifyNsfwMakesSense();

            if (!ep.foundOneImage) {
                // Note: the jsonp url may seem malformed but jquery fixes it.
                //log(jsonUrl);
                alert("Sorry, no displayable images found in that url :(");
                getRedditImages();
                startAnimation(imageIndex + 1);
            }

            // show the first image
            if (activeIndex == -1) {
                startAnimation(0);
            }

            if (e621pFailedImageNumber + e621pSuccessImageNumber == e621pLimit) {
                e621pPageNumber++;
                if(isLastImage(activeIndex)){
                  //Loads next API page if at end of list and starts navigation.
                  getRedditImages();
                }
                return;
            }else{
                // console.log(e621pFailedImageNumber);
                // console.log(e621pSuccessImageNumber);
                // console.log(e621pLimit);
                //alert("No more data from this URL :(")
                return;
            }

            // If the total number of posts in the API are smaller than the total posts requested per page, not enough to fill page, hence no more pages.
            if (returnJson.length < limit) {
                log("No more pages to load from the API, reloading the start");

                // Show the user we're starting from the top
                var numberButton = $("<span />").addClass("numberButton").text("-");
                addNumberButton(numberButton);
            }
            loadingNextImages = false;

        };

        // I still haven't been able to catch jsonp 404 events so the timeout
        // is the current solution sadly.
        var doAjax = function() {
            var settings = {
                url: jsonUrl,
                dataType: 'json',
                success: function(data){
                    retryCount = 0; // reset on success
                    handleData(data);
                },
                error: function(jqXHR, textStatus, errorThrown){
                    retryCount++;
                    if (retryCount <= maxRetries) {
                        var delay = retryDelayBase * Math.pow(2, retryCount - 1);
                        showStatus('Network error — retrying in ' + Math.round(delay/1000) + 's', 2000 + delay);
                        setTimeout(doAjax, delay);
                    } else {
                        failedAjax(jqXHR, textStatus, errorThrown);
                        showStatus('Failed to load images. Try again later.', 5000);
                    }
                },
                timeout: 8000
            };
            $.ajax(attachApiKeyHeaders(settings));
        };
        doAjax();
    };

    // var getImgurAlbum = function (url) {
    //     var albumID = url.match(/.*\/(.+?$)/)[1];
    //     var jsonUrl = 'https://api.imgur.com/3/album/' + albumID;
    //     //log(jsonUrl);
    //     var failedAjax = function (data) {
    //         alert("Failed ajax, maybe a bad url? Sorry about that :(");
    //         failCleanup();
    //     };
    //     var handleData = function (data) {
    //
    //         //console.log(data);
    //
    //         if (data.data.images.length === 0) {
    //             alert("No data from this url :(");
    //             return;
    //         }
    //
    //         $.each(data.data.images, function (i, item) {
    //             addImageSlide({
    //                 url: item.link,
    //                 title: item.title,
    //                 over18: item.nsfw,
    //                 commentsLink: ""
    //             });
    //         });
    //
    //         verifyNsfwMakesSense();
    //
    //         if (!ep.foundOneImage) {
    //             log(jsonUrl);
    //             alert("Sorry, no displayable images found in that url :(");
    //         }
    //
    //         // show the first image
    //         if (activeIndex == -1) {
    //             startAnimation(0);
    //         }
    //
    //         //log("No more pages to load from this subreddit, reloading the start");
    //
    //         // Show the user we're starting from the top
    //         //var numberButton = $("<span />").addClass("numberButton").text("-");
    //         //addNumberButton(numberButton);
    //
    //         loadingNextImages = false;
    //     };
    //
    //     $.ajax({
    //         url: jsonUrl,
    //         dataType: 'json',
    //         success: handleData,
    //         error: failedAjax,
    //         404: failedAjax,
    //         timeout: 5000,
    //         beforeSend : function(xhr) {
    //             xhr.setRequestHeader('Authorization',
    //                 'Client-ID ' + 'f2edd1ef8e66eaf');}
    //     });
    // };

    var setupUrls = function() {
        ep.urlData = ep.getRestOfUrl();
        //log(ep.urlData)
        ep.subredditUrl = ep.urlData[0];
        getVars = ep.urlData[1];

        if (getVars.length > 0) {
            getVarsQuestionMark = "?" + getVars;
        } else {
            getVarsQuestionMark = "";
        }

        // // Remove .compact as it interferes with .json (we got "/r/all/.compact.json" which doesn't work).
        // ep.subredditUrl = ep.subredditUrl.replace(/.compact/, "");
        // // Consolidate double slashes to avoid r/all/.compact/ -> r/all//
        // ep.subredditUrl = ep.subredditUrl.replace(/\/{2,}/, "/");
        //
        // var subredditName;
        // if (ep.subredditUrl === "") {
        //     ep.subredditUrl = "/";
        //     subredditName = "reddit.com" + getVarsQuestionMark;
        //     //var options = ["/r/aww/", "/r/earthporn/", "/r/foodporn", "/r/pics"];
        //     //ep.subredditUrl = options[Math.floor(Math.random() * options.length)];
        // } else {
        //     subredditName = ep.subredditUrl + getVarsQuestionMark;
        // }
        //
        //
        // var visitSubredditUrl = ep.redditBaseUrl + ep.subredditUrl + getVarsQuestionMark;
        //
        // // truncate and display subreddit name in the control box
        // var displayedSubredditName = subredditName;
        // // empirically tested capsize, TODO: make css rules to verify this is enough.
        // // it would make the "nsfw" checkbox be on its own line :(
        // var capsize = 19;
        // if(displayedSubredditName.length > capsize) {
        //     displayedSubredditName = displayedSubredditName.substr(0,capsize) + "&hellip;";
        // }
    $('#subredditUrl').text('');

        document.title = "e621p - " + (e621pTags ? e621pTags : "Latest");
    };




    ep.redditBaseUrl = "http://www.reddit.com";
    if (location.protocol === 'https:') {
        // page is secure
        ep.redditBaseUrl = "https://www.reddit.com";
        // TODO: try "//" instead of specifying the protocol
    }

    var getVars;
    // var after = "";

    initState();
    setupUrls();

    // --- Add search handler here (runs once during init) ---
    $("#searchBtn").click(function () {
        let tags = $("#tagSearch").val().trim();
        if (tags.length === 0) return;

        // Encode spaces for API
        e621pTags = tags.replace(/\s+/g, "+");

        // RESET SLIDESHOW STATE
        ep.photos = [];
        activeIndex = -1;
        e621pAfterId = 0;        // start from the newest images
        e621pPageNumber = 1;

        // Clear UI
        $("#pictureSlider").empty();     // remove old images
        $(".numberButtonList ul").empty(); // remove old numbered buttons

        // Load new images
        getRedditImages();
    });

    // Random button click
    $("#randomBtn").click(function () {
        // Use the special tag 'random' to fetch randomish content from the API
        $("#tagSearch").val('random');
        $("#searchBtn").click();
    });

    // also allow pressing 'g' to go random (lowercase g, non-conflicting)
    $(document).on('keypress', function(e){
        if (e.key === 'g' || e.key === 'G') {
            var active = document.activeElement;
            if (active && (active.id === 'tagSearch' || $(active).closest('#tagSearch').length)) return;
            showRandomSlide();
        }
    });

    // existing initial load
    // if(ep.subredditUrl.indexOf('/imgur') == 0)
    //     getImgurAlbum(ep.subredditUrl);
    // else
    getRedditImages();

    /********************
     * Search suggestions
     ********************/
    var commonSuggestions = [
        'random','wolf','fox','dragon','shark','dog','cat','animation','cute','landscape','portrait','furry','male','female','straight','gay'
    ];

    var suggestionsEl = $("#searchSuggestions");
    var previewEl = $("#searchPreview");

    var showSuggestions = function(list) {
        suggestionsEl.empty();
        if (!list || list.length === 0) { suggestionsEl.addClass('hidden'); return; }
        list.forEach(function(tag){
            var item;
            if (typeof tag === 'string') {
                item = $('<div role="option" class="suggestion"></div>').data('tag', tag).append($('<span class="tag-name"/>').text(tag));
            } else if (tag && typeof tag === 'object') {
                // API returned tag objects
                item = $('<div role="option" class="suggestion"></div>').data('tag', tag.name);
                item.append($('<span class="tag-name"/>').text(tag.name));
                item.append($('<span class="tag-count"/>').text(tag.post_count));
            } else {
                item = $('<div role="option" class="suggestion"></div>').data('tag', tag).append($('<span class="tag-name"/>').text(String(tag)));
            }
            suggestionsEl.append(item);
        });
        suggestionsEl.removeClass('hidden');
    };

    var filterSuggestions = function(val){
        var q = (val || '').toLowerCase().trim();
        if(q.length === 0){ showSuggestions(commonSuggestions.slice(0,8)); return; }
        var out = commonSuggestions.filter(function(t){ return t.indexOf(q) === 0 || t.indexOf(q) > 0 });
        showSuggestions(out.slice(0,12));

        // fetch popular tag suggestions from API (best-effort) for 3+ chars
        if (q.length >= 3) {
            var tagsUrl = 'https://e621.net/tags.json?search[name_matches]=' + encodeURIComponent(q + '*') + '&limit=8';
            $.ajax(attachApiKeyHeaders({ url: tagsUrl, dataType: 'json', success: function(data){
                try {
                    if (data && data.length) {
                        var names = data.map(function(t){ return t.name; }).filter(Boolean);
                        var merged = names.concat(out).filter(function(v,i,self){ return self.indexOf(v) === i; });
                        showSuggestions(merged.slice(0,12));
                    }
                } catch(e){}
            }, error: function(){} , timeout: 5000 }));
        }
    };

    // Preview thumbnail fetch cache
    var previewCache = {};

    // preview toggle state and request id for race-safety
    var previewEnabled = true;
    var previewRequestId = 0;

    var previewCookie = 'searchPreviewEnabled';
    var setPreviewCookie = function(val){ setCookie(previewCookie, val, cookieDays); };
    var getPreviewCookie = function(){ var v = getCookie(previewCookie); return v === undefined ? null : (v === 'true'); };

    // initialize preview toggle from cookie
    var initPreviewToggle = function(){
        var val = getPreviewCookie();
        if (val === null) { previewEnabled = true; } else { previewEnabled = val; }
        try { $('#togglePreview').prop('checked', previewEnabled); } catch(e){}
        $('#togglePreview').on('change', function(){ previewEnabled = $(this).is(':checked'); setPreviewCookie(previewEnabled); });
    };
    initPreviewToggle();

    // API Key storage helpers (localStorage)
    var API_KEY_STORAGE = 'eviewer_api_key_v1';
    function saveApiKey(key){
        try { localStorage.setItem(API_KEY_STORAGE, key || ''); } catch(e){}
    }
    function loadApiKey(){
        try { return localStorage.getItem(API_KEY_STORAGE) || ''; } catch(e){ return ''; }
    }
    function clearApiKey(){
        try { localStorage.removeItem(API_KEY_STORAGE); } catch(e){}
    }

    // Initialize settings UI (api key input)
    $(function(){
        var stored = loadApiKey();
        if (stored) {
            $('#apiKeyInput').val(stored);
        }
        $('#saveApiKeyBtn').on('click', function(){
            var v = $('#apiKeyInput').val() || '';
            saveApiKey(v);
            // give user some feedback
            $('#statusMessage').text(v ? 'API key saved' : 'API key cleared').removeClass('hidden');
            setTimeout(function(){ $('#statusMessage').addClass('hidden'); }, 1800);
        });
        $('#clearApiKeyBtn').on('click', function(){
            $('#apiKeyInput').val(''); clearApiKey();
            $('#statusMessage').text('API key cleared').removeClass('hidden');
            setTimeout(function(){ $('#statusMessage').addClass('hidden'); }, 1500);
        });
    });

    // Add API key to outgoing AJAX requests if present
    // This uses jQuery's beforeSend hook per-request below; for convenience add a helper to attach headers.
    function attachApiKeyHeaders(jqXhrSettings){
        var key = loadApiKey();
        if (!key) return jqXhrSettings;
        // Common header name: Authorization: Bearer <key> (many APIs), but e621 uses 'User-Agent' and may accept 'Authorization'.
        // We'll send both a custom header X-API-Key and Authorization: Bearer to maximize compatibility for proxies.
        var before = jqXhrSettings.beforeSend;
        jqXhrSettings.beforeSend = function(xhr){
            try { xhr.setRequestHeader('Authorization', 'Bearer ' + key); } catch(e){}
            try { xhr.setRequestHeader('X-API-Key', key); } catch(e){}
            if (before) try { before(xhr); } catch(e){}
        };
        return jqXhrSettings;
    }

    var fetchPreviewForTag = function(tag, cb) {
        if (!previewEnabled) return cb(null);
        if (previewCache[tag]) return cb(previewCache[tag]);
        var currentRequest = ++previewRequestId;
        var url = 'https://e621.net/posts.json?limit=1&tags=' + encodeURIComponent(tag);
        $.ajax(attachApiKeyHeaders({ url: url, dataType: 'json', success: function(data){
            // if a newer request started, ignore this result
            if (currentRequest !== previewRequestId) return cb(null);
            try {
                var thumb = null;
                if (data && data.posts && data.posts.length > 0) {
                    thumb = data.posts[0].file.url;
                }
                previewCache[tag] = thumb;
                cb(thumb);
            } catch(e){ cb(null); }
        }, error: function(){ cb(null); }, timeout: 7000 }));
    };

    // Interactions
    $(document).on('input', '#tagSearch', function(e){
        var v = $(this).val();
        filterSuggestions(v);
    });

    // click suggestion -> populate input and show preview (single click)
    $(document).on('click', '#searchSuggestions .suggestion', function(){
        var tag = $(this).data('tag');
        $('#tagSearch').val(tag);
        $('#searchSuggestions').addClass('hidden');
        if (!previewEnabled) return;
        previewEl.html('<div class="spinner"></div>');
        previewEl.removeClass('hidden');
        fetchPreviewForTag(tag, function(thumb){
            if(!thumb) { previewEl.addClass('hidden'); return; }
            previewEl.html('<img src="'+thumb+'" alt="preview"/>');
            previewEl.removeClass('hidden');
        });
    });

    // double click suggestion -> run search immediately
    $(document).on('dblclick', '#searchSuggestions .suggestion', function(){
        var tag = $(this).data('tag');
        $('#tagSearch').val(tag);
        $('#searchSuggestions').addClass('hidden');
        $('#searchBtn').click();
    });

    // on pointer interaction (click/tap or hover) show preview — prefer click/tap for touch devices
    $(document).on('pointerenter pointerdown click', '#searchSuggestions .suggestion', function(e){
        // if pointerenter on desktop, allow hover behavior
        var tag = $(this).data('tag');
        if (!previewEnabled) return;
        previewEl.html('<div class="spinner"></div>');
        previewEl.removeClass('hidden');
        fetchPreviewForTag(tag, function(thumb){
            if(!thumb) { previewEl.addClass('hidden'); return; }
            previewEl.html('<img src="'+thumb+'" alt="preview"/>');
            previewEl.removeClass('hidden');
        });
    });

    // On pointer leave (mouse) hide preview. On touch devices prefer explicit close (click outside) to avoid accidental hide.
    $(document).on('pointerleave', '#searchSuggestions .suggestion', function(e){
        // pointerType may be undefined in some browsers — default to hide only for mouse
        try {
            if (e && e.originalEvent && e.originalEvent.pointerType && e.originalEvent.pointerType !== 'touch') {
                previewEl.addClass('hidden');
            }
        } catch(err){
            previewEl.addClass('hidden');
        }
    });

    // Clicking outside closes suggestions/preview
    $(document).on('click', function(e){
        if(!$(e.target).closest('#searchBar').length){
            $('#searchSuggestions').addClass('hidden');
            $('#searchPreview').addClass('hidden');
        }
    });

    // show default top suggestions when focusing the input
    $(document).on('focus', '#tagSearch', function(){ filterSuggestions($(this).val()); });

    // Keyboard navigation for suggestions
    $(document).on('keydown', '#tagSearch', function(e){
        var KEY_UP = 38, KEY_DOWN = 40, KEY_ENTER = 13, KEY_ESC = 27, KEY_TAB = 9;
        var visible = !suggestionsEl.hasClass('hidden');
        if (!visible) return;
        var active = suggestionsEl.find('.suggestion.active');
        if (e.which === KEY_DOWN) {
            e.preventDefault();
            if (active.length === 0) {
                suggestionsEl.find('.suggestion').first().addClass('active');
            } else {
                var next = active.next('.suggestion');
                if (next.length) { active.removeClass('active'); next.addClass('active'); }
            }
        } else if (e.which === KEY_UP) {
            e.preventDefault();
            if (active.length === 0) {
                suggestionsEl.find('.suggestion').last().addClass('active');
            } else {
                var prev = active.prev('.suggestion');
                if (prev.length) { active.removeClass('active'); prev.addClass('active'); }
            }
        } else if (e.which === KEY_ENTER) {
            e.preventDefault();
            var sel = active.length ? active : suggestionsEl.find('.suggestion').first();
            if (sel.length) {
                var tag = sel.data('tag');
                $('#tagSearch').val(tag);
                suggestionsEl.addClass('hidden');
                $('#searchBtn').click();
            }
        } else if (e.which === KEY_TAB) {
            // show preview on tab
            var selTab = active.length ? active : suggestionsEl.find('.suggestion').first();
            if (selTab.length) {
                e.preventDefault();
                var tag = selTab.data('tag');
                $('#tagSearch').val(tag);
                suggestionsEl.addClass('hidden');
                if (previewEnabled) { previewEl.html('<div class="spinner"></div>'); previewEl.removeClass('hidden'); fetchPreviewForTag(tag, function(thumb){ if(!thumb) { previewEl.html('<div class="no-preview">No preview</div>'); return; } previewEl.html('<img src="'+thumb+'" alt="preview"/>'); }); }
            }
        } else if (e.which === KEY_ESC) {
            suggestionsEl.addClass('hidden');
        }
    });

    // Preview 'Search' button inside preview area
    $(document).on('click', '#previewSearchBtn', function(e){
        var tag = $('#tagSearch').val().trim();
        if (!tag) return;
        $('#searchBtn').click();
    });

    // Render a grid of image previews under the search box
    function renderSearchPreview(posts, query) {
        if (!posts || posts.length === 0) {
            $('#searchPreview').html('<div class="preview-empty">No preview results</div>');
            $('#searchPreview').removeClass('hidden');
            return;
        }
        var grid = $('<div class="preview-grid"/>');
        posts.forEach(function(p){
            var thumb = p.file && p.file.url ? p.file.url : '';
            var item = $('<div class="preview-item" tabindex="0"/>');
            var img = $('<img/>').attr('src', thumb).attr('alt', p.tags ? (p.tags.join ? p.tags.join(' ') : '') : 'preview');
            var meta = $('<div class="preview-meta"/>');
            var title = $('<span/>').text(query).css({'font-weight':'700'});
            var info = $('<span/>').text(p.id ? ('#' + p.id) : '');
            meta.append(title).append(info);
            item.append(img).append(meta);
            // clicking the preview opens the post url or image in a new tab
            item.on('click', function(){
                if (p.file && p.file.url) {
                    window.open(p.file.url, '_blank');
                }
            });
            grid.append(item);
        });
        $('#searchPreview').html('').append(grid);
        $('#searchPreview').removeClass('hidden');
    }

    // Debounced fetch for preview images (best-effort)
    var fetchSearchPreview = (function(){
        var timer = null;
        return function(){
            var q = $('#tagSearch').val().trim();
            clearTimeout(timer);
            if (!previewEnabled) { $('#searchPreview').addClass('hidden'); return; }
            if (!q) { $('#searchPreview').addClass('hidden'); return; }
            timer = setTimeout(function(){
                var url = 'https://e621.net/posts.json?limit=9&tags=' + encodeURIComponent(q);
                $('#searchPreview').html('<div class="preview-empty"><div class="spinner"></div></div>').removeClass('hidden');
                $.ajax(attachApiKeyHeaders({ url: url, dataType: 'json', success: function(data){
                    try {
                        var posts = (data && data.posts) ? data.posts : [];
                        renderSearchPreview(posts, q);
                    } catch(e){ $('#searchPreview').html('<div class="preview-empty">No preview results</div>'); }
                }, error: function(){ $('#searchPreview').html('<div class="preview-empty">No preview results</div>'); }, timeout: 6000 }));
            }, 300);
        };
    })();

    // attach preview behavior to input (also used by suggestion preview)
    $(document).on('input', '#tagSearch', function(){ fetchSearchPreview(); });

    // hide preview on click outside (already existing handler hides suggestions) - ensure preview hidden
    $(document).on('click', function(e){ if(!$(e.target).closest('#searchBar').length){ $('#searchPreview').addClass('hidden'); } });

    // Position preview under the search bar and clamp to viewport
    function positionPreview() {
        var $preview = $('#searchPreview');
        var $bar = $('#searchBar');
        if ($preview.length === 0 || $bar.length === 0) return;
        var barRect = $bar[0].getBoundingClientRect();
        var previewWidth = $preview.outerWidth();
        var left = barRect.left + (barRect.width / 2) - (previewWidth / 2);
        // clamp
        var minLeft = 12;
        var maxLeft = window.innerWidth - previewWidth - 12;
        left = Math.max(minLeft, Math.min(left, maxLeft));
        $preview.css({ left: left + 'px' });
    }

    function positionSuggestions() {
        var $s = $('#searchSuggestions');
        var $bar = $('#searchBar');
        if ($s.length === 0 || $bar.length === 0) return;
        var barRect = $bar[0].getBoundingClientRect();
        var sugWidth = $s.outerWidth();
        var left = barRect.left + (barRect.width / 2) - (sugWidth / 2);
        var minLeft = 8;
        var maxLeft = window.innerWidth - sugWidth - 8;
        left = Math.max(minLeft, Math.min(left, maxLeft));
        $s.css({ left: left + 'px' });
    }

    // whenever preview becomes visible, re-position
    var observer = new MutationObserver(function(mutations){
        mutations.forEach(function(m){
            if (m.target && $(m.target).is('#searchPreview')) {
                if (!$(m.target).hasClass('hidden')) positionPreview();
            }
            if (m.target && $(m.target).is('#searchSuggestions')) {
                if (!$(m.target).hasClass('hidden')) positionSuggestions();
            }
        });
    });
    var target = document.getElementById('searchPreview');
    if (target) observer.observe(target, { attributes: true, attributeFilter: ['class'] });

    // reposition on resize
    $(window).on('resize', positionPreview);

        window.slideNext = function(){
            if(!nsfw) {
                for(var i = activeIndex + 1; i < ep.photos.length; i++) {
                    if (!ep.photos[i].over18) {
                        return startAnimation(i);
                    }
                }
            }
            if (isLastImage(activeIndex) && !loadingNextImages) {
                // the only reason we got here and there aren't more pictures yet
                // is because there are no more images to load, start over
                return startAnimation(0);
            }
            startAnimation(activeIndex + 1);
        }
        $(document).ready(function () {
    if (e621pTags) {
        $("#tagSearch").val(e621pTags.replace(/\+/g, " "));
    }
});

});
