/**
 * @file
 * A JavaScript file for the theme.
 *
 *
 */
 (function (window, document, $, Drupal) {
  "use strict";

  Drupal.behaviors.search_box = {
      attach: function (context) {
          $('#search-expandable').once('expandableSearchBox',
              function () {
                  var self = $('#search-expandable'),
                      input = self.find('input[type="text"]'),
                      form = self.find('form'),
                      button = self.find('input[type="submit"]'),
                      header = $('#second_header'),
                      inputDefaultValue = $(input).defaultValue,
                      timeoutID,
                      stayOpen = false,
                      isiPad = navigator.userAgent.match(/iPad/i) != null,
                      isinCar = navigator.userAgent.toLowerCase().indexOf('qtcarbrowser') != -1;
                  if ($(input[0]).val() !== '') {
                      open_box_no_animation();
                  }
                  if (input.length > 0) {
                      button.attr('disabled', 'disabled');

                      if (isiPad || isinCar) {
                          open_box_no_animation();
                      }
                      self.on('mouseenter', function (event) {
                          event.stopPropagation();
                          window.clearTimeout(timeoutID);
                          open_box();
                      });
                      self.mouseleave(function (event) {
                          if ($(input[0]).val() !== '') {
                              stayOpen = true;
                          } else {
                              stayOpen = false;
                              timeoutID = window.setTimeout(function () {
                                  close_box();
                              }, 8000);
                          }

                      });
                      input.keypress(function (event) {
                          if (event.keyCode != 13 || event.which != 13) {
                              stayOpen = true;
                          }
                      });

                      button.click(
                          function (e) {
                              e.preventDefault();
                              if (input.val() != '') {
                                  form.submit();
                              }
                          }
                      );
                  }

                  function open_box() {
                      button.css({
                          'opacity': 1
                      });
                      form.stop().animate({
                          'opacity': 1
                      }, 150, function () {
                          header.addClass('expanded-search');
                          self.addClass('box').stop().animate({
                              width: "220px"
                          }, 300, function () {
                              input.stop().animate({
                                  'opacity': 1
                              }, 150, function () {
                                  $(this).focus();
                                  button.show().removeAttr('disabled');
                              });
                          });
                      });
                  }

                  function open_box_no_animation() {
                      button.show().css('opacity', 1);
                      form.css('opacity', 1);
                      header.addClass('expanded-search');
                      self.addClass('box').css('width', '220px');
                      input.css('opacity', 1);
                  }

                  function close_box() {
                      // do not collapse on touch screens;
                      if (isiPad || isinCar) return;
                      if (input.val() == '') {

                          button.stop().animate({
                              'opacity': 0
                          }, 500, function () {
                              self.stop().animate({
                                  width: "32px"
                              }, 400, function () {
                                  header.removeClass('expanded-search');
                                  $(this).removeClass('box');
                              });
                              input.stop().animate({
                                  'opacity': 0
                              }, 200);
                          }).hide();
                          $(this).blur();
                      }

                  }

              }
          );

          if (typeof Twilio !== "undefined") {
              var chatInitiated = false,
                  showTooltip = true,
                  repeatCheck = true;

              (function checkForChat() {
                  $.ajax({
                      type: 'POST',
                      data: {typeOfPage: typeOfPage, locale: Drupal.settings.tesla.locale},
                      url: '/conversation/check-availability',
                      success: function(data) {
                          var response = data;
                          if (Drupal.settings.tesla.country == "CN" && window.location.pathname.indexOf("/teslaaccount") > -1) {
                              response.appconfigChatTool.preEngagementConfig.fields[0].attributes.value = Drupal.behaviors.common.getFirstName();
                              response.appconfigChatTool.preEngagementConfig.fields[1].attributes.value = Drupal.behaviors.common.getLastName();
                              response.appconfigChatTool.preEngagementConfig.fields[2].attributes.value = Drupal.behaviors.common.getEmailAddress();
                          }
                          repeatCheck = response.success;
                          if (response.success) {
                              Twilio.FlexWebChat.MainHeader.defaultProps.imageUrl = '/sites/all/themes/custom/tesla_theme/assets/img/chat/tsla_logo.svg';
                              Twilio.FlexWebChat.MainHeader.defaultProps.titleText = 'Chat';
                              Twilio.FlexWebChat.MainHeader.defaultProps.showImage = true;
                              Drupal.settings.chatConfig = response.appconfigChatTool;

                              var hasAutomatedMessage = (typeof response.chattoolStrings.AutomatedMessageBody !== "undefined") && (response.chattoolStrings.AutomatedMessageBody.length > 0);
                              if (hasAutomatedMessage) {
                                  Twilio.FlexWebChat.MessagingCanvas.defaultProps.predefinedMessage = false;
                              }

                              Twilio.FlexWebChat.createWebChat(response.appconfigChatTool).then(function (webchat) {
                                  var manager = webchat.manager,
                                      channelSid;

                                  manager.strings.WelcomeMessage = response.welcomeMessage;
                                  manager.strings.PredefinedChatMessageBody = response.greetingBody;
                                  for (var key in response.chattoolStrings) {
                                      manager.strings[key] = response.chattoolStrings[key];
                                  }
                                  webchat.init();

                                  // Exposing setTwilioChatConcernType for ContactWidget, to enable it to update
                                  // the concern type, post initialization but pre engagement.
                                  Drupal.behaviors.search_box.setTwilioChatConcernType = (concernType) => {
                                      manager.configuration.context.concerntype = concernType;
                                  };

                                  Twilio.FlexWebChat.Actions.on('afterStartEngagement', function (payload) {
                                      channelSid = manager.store.getState().flex.session.channelSid;

                                      if (hasAutomatedMessage) {
                                          manager.chatClient.getChannelBySid(channelSid).then(function (channel) {
                                              channel.sendMessage(response.chattoolStrings.AutomatedMessageBody);
                                          });
                                      }
                                  });

                                  var supportChatBtn = document.getElementById("connect-chat-button");
                                  if (supportChatBtn != null && typeof supportChatBtn !== "undefined") {
                                      supportChatBtn.removeAttribute("disabled");
                                  }

                                  var tooltipEl = document.getElementById("tooltipForLiveAgent"),
                                      tooltipElBtn = tooltipEl.getElementsByClassName("ac")[0],
                                      tooltipElClose = tooltipEl.getElementsByClassName("modal-close")[0],
                                      chatBtn = document.getElementById("twilio-customer-frame").getElementsByTagName("button")[0],
                                      chatContainer = document.getElementById("twilio-customer-frame"),
                                      chatCloseBtn = chatContainer.getElementsByClassName("Twilio-MainHeader-end")[0];

                                  if (typeof tooltipElBtn !== "undefined") {
                                      tooltipElBtn.addEventListener("click", function () {
                                          document.getElementById("twilio-customer-frame").getElementsByTagName("button")[0].click();
                                          tooltipEl.style.display = "none";
                                      })
                                  }

                                  if (typeof tooltipElClose !== "undefined") {
                                      tooltipElClose.addEventListener("click", function () {
                                          tooltipEl.style.display = "none";
                                      })
                                  }

                                  if (typeof chatBtn !== "undefined") {
                                      chatBtn.addEventListener("click", function () {
                                          showTooltip = false;
                                          tooltipEl.style.display = "none";
                                      })
                                  }

                                  if (typeOfPage != "Sales") {
                                      chatContainer.addEventListener("click", function (e) {
                                          var _node;

                                          if (typeof channelSid !== "undefined" && channelSid != null) {
                                              if (e.target && e.target.nodeName) {
                                                  _node = e.target.nodeName;

                                                  if (_node == "svg" || _node == "path") {
                                                      $.ajax({
                                                          type: 'POST',
                                                          data: {currentConversation: channelSid},
                                                          url: Drupal.settings.tesla.localePrefix + '/conversation/change-status',
                                                          success: function (data) {
                                                              channelSid = null;
                                                          }
                                                      })
                                                  }
                                              }
                                          }
                                      })
                                  }

                                  setTimeout(function () {
                                      if (showTooltip && typeof chatContainer.getElementsByClassName("Twilio-MainContainer")[0] === "undefined") {
                                          tooltipEl.style.display = "block";
                                      }
                                  }, 8000);
                              });
                          }
                          else {
                              $("#twilio-customer-frame").css({"display": "none"})
                              $("#tooltipForLiveAgent").css({"display": "none"})
                              showTooltip = false;
                          }
                      }
                  })

                  if (typeOfPage == "Sales" && document.getElementById("tooltipForLiveAgent") != null) {
                      var repeatChatCheck = setInterval(function () {
                          var chatContainer = document.getElementById("twilio-customer-frame");

                          if (typeof chatContainer.getElementsByClassName("Twilio-MessagingCanvas")[0] !== "undefined") {
                              clearInterval(repeatChatCheck);
                          }
                          else {
                              $.ajax({
                                  type: 'POST',
                                  data: {typeOfPage: typeOfPage, locale: Drupal.settings.tesla.locale, limitedResponse: true},
                                  url: '/conversation/check-availability',
                                  success: function (data) {
                                      var response = data;

                                      if (!response.success) {
                                          clearInterval(repeatChatCheck);
                                      }
                                      if (chatContainer != null) {
                                          if (typeof chatContainer.getElementsByClassName("Twilio-MainContainer")[0] === "undefined") {
                                              document.getElementById("twilio-customer-frame").style.display = (response.success ? 'block' : 'none');
                                              document.getElementById("tooltipForLiveAgent").style.display = (response.success ? 'block' : 'none');
                                          }
                                      }
                                  }
                              })
                          }


                          if (!repeatCheck) {
                              clearInterval(repeatChatCheck);
                          }
                      }, 10000);
                  }
              })()
          }
      }
  };

  Drupal.behaviors.findusFilter = function () {
      var $inputs = $('.findus-autocomplete'),
          locale = Drupal.settings.tesla.localePrefix,
          autocomplete = [],
          items = [],
          geocoder;

      /**
       * Configure google autocomplete and geocoder
       */
      function init() {
          items = document.getElementsByClassName('findus-autocomplete');
          geocoder = new google.maps.Geocoder();
          $.each(items, function (index, val) {
              autocomplete[index] = new google.maps.places.Autocomplete(items[index], {
                  types: ['geocode']
              });
              google.maps.event.addListener(autocomplete[index], 'place_changed', function () {
                  redirectTo(index);
              });
          });
      }

      /**
       * Performs redirect to findus map
       *
       * @param  {integer} index textbox index
       */
      function redirectTo(index) {
          var $this = $($inputs[index]),
              filter = $this.data('findus-filter');

          var request = $.get('/sites/all/modules/custom/tesla_findus_map/proxy.php?address=' + $this.val());

          request.done(function (response) {
              try {
                  var bounds = response.results[0].geometry.bounds.northeast.lat + ',' +
                      response.results[0].geometry.bounds.northeast.lng + ',' +
                      response.results[0].geometry.bounds.southwest.lat + ',' +
                      response.results[0].geometry.bounds.southwest.lng;
                  window.location.href = locale + '/findus#/bounds/' + bounds + '?search=' + filter;
              } catch (e) {
                  window.location.href = locale + '/findus';
              }
          }).error(function (response) {
              window.location.href = locale + '/findus';
          });
      }

      /**
       * Update autocomplete labels
       *  - commented out for the time being... we may use it again. <eritchey 2014-09-25>
       */
      // function geolocate() {
      //     var request = $.get('/sites/all/modules/custom/tesla_findus_map/proxy.php?ip=true');
      //     request.done(function (response) {
      //         try {
      //             var data   = $.parseJSON(response);
      //             var $label = $('.findus-autocomplete').siblings('span');
      //             $label.find('.your-city').html(data.city + ', ' + data.country);
      //         } catch(e) {
      //         }
      //     });
      // }
      // if ($inputs.length) {
      //     init();
      //     geolocate();
      // }
  },

      // Implements Particles' side scrolling menu
      // https://particles.tesla.com/styleguide/menus_-_side_scroller.html
      Drupal.behaviors.tsla_sidescroll_menu = {
          attach: function (context) {

              var tslaSideScrollMenu = document.querySelector('.tds-sidescroll-menu');

              if (tslaSideScrollMenu) {

                  var tslaSideScrollMenuList = tslaSideScrollMenu.querySelector('.tds-nav--list_items');
                  var tslaSideScrollMenuListLeftPosition = tslaSideScrollMenuList.offsetLeft;
                  var tslaSideScrollMenuListScrollPosition = tslaSideScrollMenuList.scrollLeft;

                  tslaSideScrollMenuList.addEventListener('scroll', function () {

                      tslaSideScrollMenu.setAttribute('data-tsla_showsidescroll_arrow', 'false');

                      if (tslaSideScrollMenuList.offsetLeft == tslaSideScrollMenuList.scrollLeft) {
                          tslaSideScrollMenu.setAttribute('data-tsla_showsidescroll_arrow', 'true');
                      }
                  });
              }
          }
      };

  Drupal.behaviors.flexslider_height = {
      attach: function (context) {
          var $window = $(window),
              flexslider,
              $thumbnail = $('#thumbnail_slider').find('.flexslider'),
              $flexslider = $('#hero_slider').find('.flexslider'),
              $loader = $('.loader');

          $window.load(function () {
              $loader.hide();
              //$thumbnail.hide();
              if ($flexslider.length > 0) {
                  $loader.show();
                  $flexslider.on('start', function () {
                      $loader.hide();
                      $thumbnail.show();
                  });
              }
          });

          if ($thumbnail.length > 0) {
              $thumbnail.flexslider({
                  asNavFor: '#hero_slider',
                  animation: "slide",
                  controlNav: false,
                  animationLoop: false,
                  slideshow: false,
                  itemWidth: checkWidth(),
                  itemMargin: 10,
                  start: function (slider) {
                      flexslider = slider;
                      var gridSize = checkWidth();
                      flexslider.vars.itemWidth = gridSize;
                  }
              });
          }

          function checkWidth() {
              if (window.innerWidth < 640) {
                  return 110;
              } else if (window.innerWidth < 960) {
                  return 157;
              } else {
                  return 177;
              }
          }

          $window.resize(function () {
              if ($thumbnail.length > 0) {
                  var gridSize = checkWidth();
                  flexslider.vars.itemWidth = gridSize;
              }
          });
      }
  };

  Drupal.behaviors.toggle_modal = {
      attach: function (context) {
          $('#page').on('click', '.modal-link', function (e) {
              var $this = $(this),
                  modalTarget = $this.data('target'),
                  sliderDoo = $(modalTarget);

              if (sliderDoo.hasClass('slidedown')) {
                  sliderDoo.removeAttr('style').removeClass('slidedown').addClass('slideup');
              } else {
                  sliderDoo.removeAttr('style').removeClass('slideup').addClass('slidedown');
              }
              $('html, body').animate({
                  scrollTop: $(document).height()
              }, 'slow');
          });

          $('#page').on('click', '.modal-link-locale', function (e) {
              var $this = $(this),
                  modalTarget = $this.data('target'),
                  $sliderDoo = $(modalTarget);

              $sliderDoo.removeAttr('style').toggleClass("show");
              $("#tsla-header-main--trigger").prop("checked", false);
              $('body').addClass('locale-modal-open');
              setTimeout(function () {
                  $('.modal-body-container', '#locale-modal').scrollTop(0);
              }, 10)
          });

          $('#page').on('click', '.has-sub-language', function (e) {

              e.preventDefault();

              $(this).parent(".language").toggleClass("active");

              $(".has-sub-language", "#locale-modal").not(this).parent(".language").removeClass("active");
          });

          $('.modal-close', '#locale-modal').on('click', function () {
              $('#locale-modal').removeClass("show");
              $('body').removeClass('locale-modal-open').removeClass('tsla-prevent-scroll');
          })

          var $userLandPref = document.getElementById("user-lang-pref"),
              _country,
              _lookupHandler,
              _firstTimeVisible = false,
              _returningUser;

          if ($userLandPref != null) {
              _lookupHandler = {
                  lookupSuccess: function (data) {
                      _country = data.country.iso_code;
                      if (_country != Drupal.settings.tesla.country) {
                          if (["CA", "LU", "BE", "CH", "MO", "HK"].indexOf(_country) > -1) {
                              _returningUser = Drupal.behaviors.common.readCookie('returning_user');
                              if (_returningUser == null || typeof _returningUser === "undefined") {
                                  $userLandPref.className = _country;
                                  _firstTimeVisible = true;
                                  Drupal.behaviors.common.createCookie('returning_user', true, 360, Drupal.settings.SharingCookies.AcrossDomain);
                              }
                          }
                      }
                  },

                  lookupFail: function (data) {
                  }
              }

              geoip2.city(_lookupHandler.lookupSuccess, _lookupHandler.lookupFail);

              $("a", $userLandPref).on("click", function (e) {
                  e.preventDefault();

                  $(".modal-link-locale", "#user-lang-pref").trigger("click");
              })

              $(".tsla-header-main--trigger_icon", $userLandPref).off().on("click", function (e) {
                  e.preventDefault();
                  e.stopPropagation();

                  $userLandPref.className += " locale-valid";
              })

              $(document).on("scroll", function () {
                  if (_firstTimeVisible) {
                      $(".tsla-header-main--trigger_icon", $userLandPref).trigger("click");
                      _firstTimeVisible = false;
                  }
              })
          }
      }
  };


  /**
   * Author:      Eric Ritchey
   * Updated:     2015-03-25
   * Description: Add class to header of pages with skinny footer
   *              to keep it at the bottom of the browser's window
   *
   * At the default zoom level, there is only 1 page that need this "footer-fixed" class:
   *   1. Five Minute Credit app - content hidden until you make some selections
   *
   * As such, removing the "check every 250ms" functionality in favor of targeting only
   * these specific pages. The code for the Credit App has been moved to the module
   * (tesla_five_minute_credit.module) for initial load, then added/removed as necessary
   * via that module's javascript.
   */
  Drupal.behaviors.set_footer_position_as_necessary = {
      attach: function (context) {
          var $html = $('html');

          Drupal.behaviors.findusFilter();

          $(window).load(function () {
              if ($html.hasClass('page-has-skinny-footer')) {
                  Drupal.behaviors.set_footer_position_as_necessary.stickyFooter();
              }
          });

          // Don't trigger resize() on every tick of the window resizing,
          // but wait until the resizing is done.
          var resizeAnimationFrame;
          $(window).on('orientationchange resize', function () {
              if (resizeAnimationFrame) {
                  cancelAnimationFrame(resizeAnimationFrame);
              }
              resizeAnimationFrame = requestAnimationFrame(Drupal.behaviors.set_footer_position_as_necessary.stickyFooter);
          });
      },
      stickyFooter: function () {
          var $html = $('html'),
              body = document.body,
              html = document.documentElement,
              $outer = $('.outer'),
              documentHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight, $outer.height());

          if (documentHeight <= $(window).innerHeight()) {
              $html.addClass('footer-fixed');
          } else {
              $html.removeClass('footer-fixed');
          }
      }
  };

  Drupal.behaviors.views_load_more = {
      attach: function (context) {

          $('.view-comments').once('newContent', function () {
              $(this).on('views_load_more.new_content', function (e, new_content) {
                  if ($(this).find('.pager').length == 0) {
                      $(this).find('.views-row-last').addClass('final-row');
                  }

              })
          });
      }
  };

  Drupal.behaviors.handle_header = {
      attach: function (context) {
          window.tslaHeader = function () {
              var tslaBodyTag = document.body;
              var tslaMenuMask = document.getElementById('tsla-header-mask');
              var tslaMenuHeader = document.getElementById('tsla-header-main');
              var tslaMenuCheckbox = document.getElementById('tsla-header-main--trigger');
              var tslaHeaderCheckboxes = document.getElementsByClassName('tsla-header-checkbox');
              var tslaHeaderNavContainer = document.querySelector('.tsla-header-nav');
              var tslaLastScrollTop = 0;

              // uncheck all the checkboxes
              function uncheckCheckboxes(elements) {
                  if (elements.length) {
                      for (var i = 0; i < elements.length; i++) {
                          elements[i].checked = false;
                      }
                  }
              }

              // if the browser window is greater than or equal to 640, uncheck checkboxes
              function tslaResize() {
                  if (window.innerWidth >= 640) {
                      uncheckCheckboxes(tslaHeaderCheckboxes);
                      tslaBodyTag.classList.remove('tsla-prevent-scroll');
                  }
              }

              // if user has scrolled the page up, reveal header
              // if user has scrolled the page down, conceal header
              function tslaPageScrolling(e) {
                  var tslaCurrentScrollTop = window.pageYOffset || tslaBodyTag.scrollTop;
                  if (Math.abs(tslaCurrentScrollTop) > Math.abs(tslaLastScrollTop)) {
                      tslaBodyTag.classList.add('tsla-header-scrolled');
                  } else {
                      tslaBodyTag.classList.remove('tsla-header-scrolled');
                  }
                  tslaLastScrollTop = tslaCurrentScrollTop;
              }

              // intercept touchmove events and prevent all interactions on given element `e`
              function tslaInterceptTouchMove(e) {
                  e.preventDefault();
                  e.stopPropagation();
              }

              // if user clicks on the 'mask', uncheck all the checkboxes
              tslaMenuMask && tslaMenuMask.addEventListener('click', function () {
                  if (tslaMenuCheckbox.checked) {
                      uncheckCheckboxes(tslaHeaderCheckboxes);
                      tslaBodyTag.classList.remove('tsla-prevent-scroll');
                  }
              });


              // if user clicks on the menu opener, add/remove a class to the body tag
              tslaMenuCheckbox && tslaMenuCheckbox.addEventListener('click', function () {
                  if (tslaMenuCheckbox.checked) {
                      tslaBodyTag.classList.add('tsla-prevent-scroll');
                  } else {
                      tslaBodyTag.classList.remove('tsla-prevent-scroll');
                      uncheckCheckboxes(tslaHeaderCheckboxes);
                  }
              });

              // listen for the window resize event
              window.addEventListener('resize', tslaResize);

              // Detect scroll event and fire scrolling event
              document.addEventListener("scroll", tslaPageScrolling, false);

              // listen for and intercept touchmove events
              tslaMenuMask && tslaMenuMask.addEventListener('touchmove', tslaInterceptTouchMove);
          }
      }
  };


  /**
   *  Drupal core override function (drupal.js) to handle error messages
   */
  Drupal.displayAjaxError = function (message) {
      if (!Drupal.beforeUnloadCalled) {
          console.log(message);
      }
  };

  /**
   * Swap the logged-in class based on the tesla_logged_in cookie.
   *
   * Some pages have cookies stripped before serving by Drupal/Varnish. This
   * allows authenticated users to be served anonymous content. We toggle
   * the body class to accurately reflect if the user is logged-in, allowing
   * authenticated or anonymous-only content to toggle based on this body
   * class.
   *
   * Rather than target classes that are specific to Drupal (not-logged-in,
   * logged-in), add Particles classes and target those for the UI changes
   * necessary. They follow the same logic.
   */
  $(document).ready(function () {
      if (window.tslaHeader) {
          window.tslaHeader();
      }
      var tesla_logged_in = Drupal.behaviors.common.readCookie('tesla_logged_in');
      if (tesla_logged_in === 'Y') {
          $('body').removeClass('not-logged-in tsla-user_is--logged_out').addClass('logged-in tsla-user_is--logged_in');
      } else {
          $('body').removeClass('logged-in tsla-user_is--logged_in').addClass('not-logged-in tsla-user_is--logged_out');
      }
  });

  Drupal.behaviors.dark_more = {
      attach: function (context) {
          if (window.location.pathname.indexOf("/support") > -1) {
              if (window.location.search.indexOf("dark_mode") > -1) {
                  document.getElementsByTagName("body")[0].className += " dark-mode";
                  
                  /**
                   * Append support link URLs with dark mode parameter to ensure persistence.
                   * See: https://issues.teslamotors.com/browse/CUA-2896
                   */
                  var links = document.querySelectorAll('a');
                  var origin = window.location.origin;
                  var originRegex = origin === 'https://stage.tesla.com' ? "(https:\/\/www\\.tesla\\.com|https:\/\/stage\\.tesla\\.com)" : "https:\/\/www\.tesla\.com";

                  var regex = new RegExp('^(\/support|#|' + originRegex + '\/support)');
                  Array.from(links).forEach((link) => {
                      if (link.href.indexOf('dark_mode') === -1 && regex.test(link.href)) {
                          link.href += link.href.indexOf('?') === -1 ? '?dark_mode=true' : '&dark_mode=true';
                      }
                  });
              }

              if (window.location.search.indexOf("ham_burglar") > -1) {
                  document.getElementsByTagName("body")[0].className += " ham-burglar";
              }
          }
      }
  }

}(this, this.document, this.jQuery, this.Drupal));
;
/**
* Script for tracking energy and vehicle page views in the browser localStorage to later tailor user experience
*/

(function (Drupal) {
  var energyPageTracking = Drupal && Drupal.settings && Drupal.settings.energyPageTracking;
  var energyPageRegex = /(\/energy($|\?)|\/solarpanels($|\?)|\/solarroof($|\?)|\/powerwall($|\?)|\/commercial($|\?)|\/utilities($|\?))/g;
  var energyPage = energyPageRegex.test(window.location.href);

  var vehiclePageRegex = /(\/drive($|\?)|\/tradein($|\?)|\/order($|\?)|\/model(s|x)\/design($|\?)|\/inventory\/(new|used)\/(ms|mx)($|\?)|\/(teslaroadster|model3)\/reserve($|\?))/g;
  var vehiclePage = vehiclePageRegex.test(window.location.href);

  var key;
  if (vehiclePage) {
      key = energyPageTracking && energyPageTracking.vehicleKey;
  } else if (energyPage) {
      key = energyPageTracking && energyPageTracking.energyKey;
  }

  if ((vehiclePage || energyPage) && Storage && key) {
      Storage.set(key, true, { expires: 'month' });
  }
}(this.Drupal));;
/*
*
* Client Encryption of Forms.
*
* Includes: 
* * RSA and ECC in JavaScript | http://www-cs-students.stanford.edu/~tjw/jsbn/
* * Stanford Javascript Crypto Library | http://crypto.stanford.edu/sjcl/
* * JSON in JavaScript | http://www.JSON.org/
* 
* Version: 0_1_20_1
* Author:  ADYEN (c) 2014
*/
(function(bd,aw){var ax,ap,T=function(){return""};(function(){try{var e=[new Uint8Array(1),new Uint32Array(1),new Int32Array(1)];return}catch(q){}function t(A,z){return this.slice(A,z)}function y(A,C){if(arguments.length<2){C=0}for(var z=0,B=A.length;z<B;++z,++C){this[C]=A[z]&255}}function u(B){var z;if(typeof B==="number"){z=new Array(B);for(var A=0;A<B;++A){z[A]=0}}else{z=B.slice(0)}z.subarray=t;z.buffer=z;z.byteLength=z.length;z.set=y;if(typeof B==="object"&&B.buffer){z.buffer=B.buffer}return z}try{window.Uint8Array=u}catch(q){}try{window.Uint32Array=u}catch(q){}try{window.Int32Array=u}catch(q){}})();(function(){try{if(typeof window==="undefined"){return}if("btoa" in window){return}var q="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";window.btoa=function(B){var D="";var C,E;for(C=0,E=B.length;C<E;C+=3){var y=B.charCodeAt(C)&255;var z=B.charCodeAt(C+1)&255;var A=B.charCodeAt(C+2)&255;var F=y>>2,G=((y&3)<<4)|(z>>4);var t=C+1<E?((z&15)<<2)|(A>>6):64;var u=C+2<E?(A&63):64;D+=q.charAt(F)+q.charAt(G)+q.charAt(t)+q.charAt(u)}return D}}catch(e){}})();var aV="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var aQ="=";function a1(y){var q;var u;var t="";for(q=0;q+3<=y.length;q+=3){u=parseInt(y.substring(q,q+3),16);t+=aV.charAt(u>>6)+aV.charAt(u&63)}if(q+1==y.length){u=parseInt(y.substring(q,q+1),16);t+=aV.charAt(u<<2)}else{if(q+2==y.length){u=parseInt(y.substring(q,q+2),16);t+=aV.charAt(u>>2)+aV.charAt((u&3)<<4)}}while((t.length&3)>0){t+=aQ}return t}function d(u){var z="";var y;var t=0;var q;for(y=0;y<u.length;++y){if(u.charAt(y)==aQ){break}v=aV.indexOf(u.charAt(y));if(v<0){continue}if(t==0){z+=bp(v>>2);q=v&3;t=1}else{if(t==1){z+=bp((q<<2)|(v>>4));q=v&15;t=2}else{if(t==2){z+=bp(q);z+=bp(v>>2);q=v&3;t=3}else{z+=bp((q<<2)|(v>>4));z+=bp(v&15);t=0}}}}if(t==1){z+=bp(q<<2)}return z}function aI(t){var u=d(t);var y;var q=new Array();for(y=0;2*y<u.length;++y){q[y]=parseInt(u.substring(2*y,2*y+2),16)}return q}var bl;var a7=244837814094590;var aU=((a7&16777215)==15715070);function bh(t,u,q){if(t!=null){if("number"==typeof t){this.fromNumber(t,u,q)}else{if(u==null&&"string"!=typeof t){this.fromString(t,256)}else{this.fromString(t,u)}}}}function m(){return new bh(null)}function c(z,t,q,A,u,y){while(--y>=0){var B=t*this[z++]+q[A]+u;u=Math.floor(B/67108864);q[A++]=B&67108863}return u}function bo(C,u,t,D,z,G){var A=u&32767,y=u>>15;while(--G>=0){var E=this[C]&32767;var B=this[C++]>>15;var F=y*E+B*A;E=A*E+((F&32767)<<15)+t[D]+(z&1073741823);z=(E>>>30)+(F>>>15)+y*B+(z>>>30);t[D++]=E&1073741823}return z}function bn(C,u,t,D,z,G){var A=u&16383,y=u>>14;while(--G>=0){var E=this[C]&16383;var B=this[C++]>>14;var F=y*E+B*A;E=A*E+((F&16383)<<14)+t[D]+z;z=(E>>28)+(F>>14)+y*B;t[D++]=E&268435455}return z}if(aU&&(navigator.appName=="Microsoft Internet Explorer")){bh.prototype.am=bo;bl=30}else{if(aU&&(navigator.appName!="Netscape")){bh.prototype.am=c;bl=26}else{bh.prototype.am=bn;bl=28}}bh.prototype.DB=bl;bh.prototype.DM=((1<<bl)-1);bh.prototype.DV=(1<<bl);var aW=52;bh.prototype.FV=Math.pow(2,aW);bh.prototype.F1=aW-bl;bh.prototype.F2=2*bl-aW;var a2="0123456789abcdefghijklmnopqrstuvwxyz";var a5=new Array();var bf,S;bf="0".charCodeAt(0);for(S=0;S<=9;++S){a5[bf++]=S}bf="a".charCodeAt(0);for(S=10;S<36;++S){a5[bf++]=S}bf="A".charCodeAt(0);for(S=10;S<36;++S){a5[bf++]=S}function bp(e){return a2.charAt(e)}function X(e,q){var t=a5[e.charCodeAt(q)];return(t==null)?-1:t}function aT(e){for(var q=this.t-1;q>=0;--q){e[q]=this[q]}e.t=this.t;e.s=this.s}function x(e){this.t=1;this.s=(e<0)?-1:0;if(e>0){this[0]=e}else{if(e<-1){this[0]=e+this.DV}else{this.t=0}}}function f(q){var e=m();e.fromInt(q);return e}function U(t,B){var z;if(B==16){z=4}else{if(B==8){z=3}else{if(B==256){z=8}else{if(B==2){z=1}else{if(B==32){z=5}else{if(B==4){z=2}else{this.fromRadix(t,B);return}}}}}}this.t=0;this.s=0;var u=t.length,A=false,y=0;while(--u>=0){var q=(z==8)?t[u]&255:X(t,u);if(q<0){if(t.charAt(u)=="-"){A=true}continue}A=false;if(y==0){this[this.t++]=q}else{if(y+z>this.DB){this[this.t-1]|=(q&((1<<(this.DB-y))-1))<<y;this[this.t++]=(q>>(this.DB-y))}else{this[this.t-1]|=q<<y}}y+=z;if(y>=this.DB){y-=this.DB}}if(z==8&&(t[0]&128)!=0){this.s=-1;if(y>0){this[this.t-1]|=((1<<(this.DB-y))-1)<<y}}this.clamp();if(A){bh.ZERO.subTo(this,this)}}function ao(){var e=this.s&this.DM;while(this.t>0&&this[this.t-1]==e){--this.t}}function P(C){if(this.s<0){return"-"+this.negate().toString(C)}var B;if(C==16){B=4}else{if(C==8){B=3}else{if(C==2){B=1}else{if(C==32){B=5}else{if(C==4){B=2}else{return this.toRadix(C)}}}}}var z=(1<<B)-1,t,q=false,y="",A=this.t;var u=this.DB-(A*this.DB)%B;if(A-->0){if(u<this.DB&&(t=this[A]>>u)>0){q=true;y=bp(t)}while(A>=0){if(u<B){t=(this[A]&((1<<u)-1))<<(B-u);t|=this[--A]>>(u+=this.DB-B)}else{t=(this[A]>>(u-=B))&z;if(u<=0){u+=this.DB;--A}}if(t>0){q=true}if(q){y+=bp(t)}}}return q?y:"0"}function au(){var e=m();bh.ZERO.subTo(this,e);return e}function ba(){return(this.s<0)?this.negate():this}function ae(e){var q=this.s-e.s;if(q!=0){return q}var t=this.t;q=t-e.t;if(q!=0){return(this.s<0)?-q:q}while(--t>=0){if((q=this[t]-e[t])!=0){return q}}return 0}function o(q){var t=1,e;if((e=q>>>16)!=0){q=e;t+=16}if((e=q>>8)!=0){q=e;t+=8}if((e=q>>4)!=0){q=e;t+=4}if((e=q>>2)!=0){q=e;t+=2}if((e=q>>1)!=0){q=e;t+=1}return t}function R(){if(this.t<=0){return 0}return this.DB*(this.t-1)+o(this[this.t-1]^(this.s&this.DM))}function bg(t,e){var q;for(q=this.t-1;q>=0;--q){e[q+t]=this[q]}for(q=t-1;q>=0;--q){e[q]=0}e.t=this.t+t;e.s=this.s}function aS(t,e){for(var q=t;q<this.t;++q){e[q-t]=this[q]}e.t=Math.max(this.t-t,0);e.s=this.s}function Q(u,B){var q=u%this.DB;var t=this.DB-q;var z=(1<<t)-1;var A=Math.floor(u/this.DB),y=(this.s<<q)&this.DM,C;for(C=this.t-1;C>=0;--C){B[C+A+1]=(this[C]>>t)|y;y=(this[C]&z)<<q}for(C=A-1;C>=0;--C){B[C]=0}B[A]=y;B.t=this.t+A+1;B.s=this.s;B.clamp()}function s(u,A){A.s=this.s;var z=Math.floor(u/this.DB);if(z>=this.t){A.t=0;return}var q=u%this.DB;var t=this.DB-q;var y=(1<<q)-1;A[0]=this[z]>>q;for(var B=z+1;B<this.t;++B){A[B-z-1]|=(this[B]&y)<<t;A[B-z]=this[B]>>q}if(q>0){A[this.t-z-1]|=(this.s&y)<<t}A.t=this.t-z;A.clamp()}function aX(z,u){var y=0,t=0,q=Math.min(z.t,this.t);while(y<q){t+=this[y]-z[y];u[y++]=t&this.DM;t>>=this.DB}if(z.t<this.t){t-=z.s;while(y<this.t){t+=this[y];u[y++]=t&this.DM;t>>=this.DB}t+=this.s}else{t+=this.s;while(y<z.t){t-=z[y];u[y++]=t&this.DM;t>>=this.DB}t-=z.s}u.s=(t<0)?-1:0;if(t<-1){u[y++]=this.DV+t}else{if(t>0){u[y++]=t}}u.t=y;u.clamp()}function aa(z,u){var q=this.abs(),t=z.abs();var y=q.t;u.t=y+t.t;while(--y>=0){u[y]=0}for(y=0;y<t.t;++y){u[y+q.t]=q.am(0,t[y],u,y,0,q.t)}u.s=0;u.clamp();if(this.s!=z.s){bh.ZERO.subTo(u,u)}}function at(y){var t=this.abs();var q=y.t=2*t.t;while(--q>=0){y[q]=0}for(q=0;q<t.t-1;++q){var u=t.am(q,t[q],y,2*q,0,1);if((y[q+t.t]+=t.am(q+1,2*t[q],y,2*q+1,u,t.t-q-1))>=t.DV){y[q+t.t]-=t.DV;y[q+t.t+1]=1}}if(y.t>0){y[y.t-1]+=t.am(q,t[q],y,2*q,0,1)}y.s=0;y.clamp()}function ab(G,J,K){var t=G.abs();if(t.t<=0){return}var I=this.abs();if(I.t<t.t){if(J!=null){J.fromInt(0)}if(K!=null){this.copyTo(K)}return}if(K==null){K=m()}var M=m(),bs=this.s,H=G.s;var y=this.DB-o(t[t.t-1]);if(y>0){t.lShiftTo(y,M);I.lShiftTo(y,K)}else{t.copyTo(M);I.copyTo(K)}var E=M.t;var br=M[E-1];if(br==0){return}var F=br*(1<<this.F1)+((E>1)?M[E-2]>>this.F2:0);var D=this.FV/F,e=(1<<this.F1)/F,q=1<<this.F2;var B=K.t,C=B-E,L=(J==null)?m():J;M.dlShiftTo(C,L);if(K.compareTo(L)>=0){K[K.t++]=1;K.subTo(L,K)}bh.ONE.dlShiftTo(E,L);L.subTo(M,M);while(M.t<E){M[M.t++]=0}while(--C>=0){var bq=(K[--B]==br)?this.DM:Math.floor(K[B]*D+(K[B-1]+q)*e);if((K[B]+=M.am(0,bq,K,C,0,E))<bq){M.dlShiftTo(C,L);K.subTo(L,K);while(K[B]<--bq){K.subTo(L,K)}}}if(J!=null){K.drShiftTo(E,J);if(bs!=H){bh.ZERO.subTo(J,J)}}K.t=E;K.clamp();if(y>0){K.rShiftTo(y,K)}if(bs<0){bh.ZERO.subTo(K,K)}}function an(e){var q=m();this.abs().divRemTo(e,null,q);if(this.s<0&&q.compareTo(bh.ZERO)>0){e.subTo(q,q)}return q}function ak(e){this.m=e}function aM(e){if(e.s<0||e.compareTo(this.m)>=0){return e.mod(this.m)}else{return e}}function a9(e){return e}function ai(e){e.divRemTo(this.m,null,e)}function af(q,t,e){q.multiplyTo(t,e);this.reduce(e)}function bj(q,e){q.squareTo(e);this.reduce(e)}ak.prototype.convert=aM;ak.prototype.revert=a9;ak.prototype.reduce=ai;ak.prototype.mulTo=af;ak.prototype.sqrTo=bj;function Y(){if(this.t<1){return 0}var q=this[0];if((q&1)==0){return 0}var e=q&3;e=(e*(2-(q&15)*e))&15;e=(e*(2-(q&255)*e))&255;e=(e*(2-(((q&65535)*e)&65535)))&65535;e=(e*(2-q*e%this.DV))%this.DV;return(e>0)?this.DV-e:-e}function j(e){this.m=e;this.mp=e.invDigit();this.mpl=this.mp&32767;this.mph=this.mp>>15;this.um=(1<<(e.DB-15))-1;this.mt2=2*e.t}function a8(q){var e=m();q.abs().dlShiftTo(this.m.t,e);e.divRemTo(this.m,null,e);if(q.s<0&&e.compareTo(bh.ZERO)>0){this.m.subTo(e,e)}return e}function bi(q){var e=m();q.copyTo(e);this.reduce(e);return e}function ar(q){while(q.t<=this.mt2){q[q.t++]=0}for(var u=0;u<this.m.t;++u){var e=q[u]&32767;var t=(e*this.mpl+(((e*this.mph+(q[u]>>15)*this.mpl)&this.um)<<15))&q.DM;e=u+this.m.t;q[e]+=this.m.am(0,t,q,u,0,this.m.t);while(q[e]>=q.DV){q[e]-=q.DV;q[++e]++}}q.clamp();q.drShiftTo(this.m.t,q);if(q.compareTo(this.m)>=0){q.subTo(this.m,q)}}function bb(q,e){q.squareTo(e);this.reduce(e)}function W(q,t,e){q.multiplyTo(t,e);this.reduce(e)}j.prototype.convert=a8;j.prototype.revert=bi;j.prototype.reduce=ar;j.prototype.mulTo=W;j.prototype.sqrTo=bb;function n(){return((this.t>0)?(this[0]&1):this.s)==0}function V(u,t){if(u>4294967295||u<1){return bh.ONE}var y=m(),q=m(),z=t.convert(this),A=o(u)-1;z.copyTo(y);while(--A>=0){t.sqrTo(y,q);if((u&(1<<A))>0){t.mulTo(q,z,y)}else{var e=y;y=q;q=e}}return t.revert(y)}function bc(e,q){var t;if(e<256||q.isEven()){t=new ak(q)}else{t=new j(q)}return this.exp(e,t)}bh.prototype.copyTo=aT;bh.prototype.fromInt=x;bh.prototype.fromString=U;bh.prototype.clamp=ao;bh.prototype.dlShiftTo=bg;bh.prototype.drShiftTo=aS;bh.prototype.lShiftTo=Q;bh.prototype.rShiftTo=s;bh.prototype.subTo=aX;bh.prototype.multiplyTo=aa;bh.prototype.squareTo=at;bh.prototype.divRemTo=ab;bh.prototype.invDigit=Y;bh.prototype.isEven=n;bh.prototype.exp=V;bh.prototype.toString=P;bh.prototype.negate=au;bh.prototype.abs=ba;bh.prototype.compareTo=ae;bh.prototype.bitLength=R;bh.prototype.mod=an;bh.prototype.modPowInt=bc;bh.ZERO=f(0);bh.ONE=f(1);function r(){this.i=0;this.j=0;this.S=new Array}function h(u){var q,t,e;for(q=0;q<256;++q){this.S[q]=q}t=0;for(q=0;q<256;++q){t=t+this.S[q]+u[q%u.length]&255;e=this.S[q];this.S[q]=this.S[t];this.S[t]=e}this.i=0;this.j=0}function b(){var e;this.i=this.i+1&255;this.j=this.j+this.S[this.i]&255;e=this.S[this.i];this.S[this.i]=this.S[this.j];this.S[this.j]=e;return this.S[e+this.S[this.i]&255]}function be(){return new r}r.prototype.init=h;r.prototype.next=b;var am=256;var w;var aA;var aY;function g(e){aA[aY++]^=e&255;aA[aY++]^=(e>>8)&255;aA[aY++]^=(e>>16)&255;aA[aY++]^=(e>>24)&255;if(aY>=am){aY-=am}}function az(){g(new Date().getTime())}if(aA==null){aA=[];aY=0;var ah;try{if(window.crypto&&window.crypto.getRandomValues){var av=new Uint8Array(32);window.crypto.getRandomValues(av);for(ah=0;ah<32;++ah){aA[aY++]=av[ah]}}else{if(window.msCrypto&&window.msCrypto.getRandomValues){var av=new Uint8Array(32);window.msCrypto.getRandomValues(av);for(ah=0;ah<32;++ah){aA[aY++]=av[ah]}}else{if(window.crypto&&window.crypto.random){var ac=window.crypto.random(32);for(ah=0;ah<ac.length;++ah){aA[aY++]=ac.charCodeAt(ah)&255}}}}}catch(aq){}while(aY<am){ah=Math.floor(65536*Math.random());aA[aY++]=ah>>>8;aA[aY++]=ah&255}aY=0;az()}function Z(){if(w==null){az();w=be();w.init(aA);for(aY=0;aY<aA.length;++aY){aA[aY]=0}aY=0}return w.next()}function bk(e){var q;for(q=0;q<e.length;++q){e[q]=Z()}}function a0(){}a0.prototype.nextBytes=bk;function l(e,q){return new bh(e,q)}function a4(A,t){if(t<A.length+11){alert("Message too long for RSA");return null}var u=new Array();var y=A.length-1;while(y>=0&&t>0){u[--t]=A[y--]}u[--t]=0;var z=new a0();var q=new Array();while(t>2){q[0]=0;while(q[0]==0){z.nextBytes(q)}u[--t]=q[0]}u[--t]=2;u[--t]=0;return new bh(u)}function al(){this.n=null;this.e=0;this.d=null;this.p=null;this.q=null;this.dmp1=null;this.dmq1=null;this.coeff=null}function N(e,q){if(e!=null&&q!=null&&e.length>0&&q.length>0){this.n=l(e,16);this.e=parseInt(q,16)}else{alert("Invalid RSA public key")}}function aR(e){return e.modPowInt(this.e,this.n)}function O(q){var t=a4(q,(this.n.bitLength()+7)>>3);if(t==null){return null}var u=this.doPublic(t);if(u==null){return null}var y=u.toString(16);if((y.length&1)==0){return y}else{return"0"+y}}function i(q){var e=this.encrypt(q);if(e){return a1(e)}else{return null}}al.prototype.doPublic=aR;al.prototype.setPublic=N;al.prototype.encrypt=O;al.prototype.encrypt_b64=i;"use strict";function aj(e){throw e}var ah=void 0,ag=!1;var k={cipher:{},hash:{},keyexchange:{},mode:{},misc:{},codec:{},exception:{corrupt:function(e){this.toString=function(){return"CORRUPT: "+this.message};this.message=e},invalid:function(e){this.toString=function(){return"INVALID: "+this.message};this.message=e},bug:function(e){this.toString=function(){return"BUG: "+this.message};this.message=e},notReady:function(e){this.toString=function(){return"NOT READY: "+this.message};this.message=e}}};"undefined"!==typeof module&&module.exports&&(module.exports=k);"function"===typeof ax&&ax([],function(){return k});k.cipher.aes=function(u){this.k[0][0][0]||this.D();var y,z,A,B,e=this.k[0][4],q=this.k[1];y=u.length;var t=1;4!==y&&(6!==y&&8!==y)&&aj(new k.exception.invalid("invalid aes key size"));this.b=[A=u.slice(0),B=[]];for(u=y;u<4*y+28;u++){z=A[u-1];if(0===u%y||8===y&&4===u%y){z=e[z>>>24]<<24^e[z>>16&255]<<16^e[z>>8&255]<<8^e[z&255],0===u%y&&(z=z<<8^z>>>24^t<<24,t=t<<1^283*(t>>7))}A[u]=A[u-y]^z}for(y=0;u;y++,u--){z=A[y&3?u:u-4],B[y]=4>=u||4>y?z:q[0][e[z>>>24]]^q[1][e[z>>16&255]]^q[2][e[z>>8&255]]^q[3][e[z&255]]}};k.cipher.aes.prototype={encrypt:function(e){return ad(this,e,0)},decrypt:function(e){return ad(this,e,1)},k:[[[],[],[],[],[]],[[],[],[],[],[]]],D:function(){var y=this.k[0],z=this.k[1],A=y[4],B=z[4],C,D,E,F=[],e=[],G,t,q,u;for(C=0;256>C;C++){e[(F[C]=C<<1^283*(C>>7))^C]=C}for(D=E=0;!A[D];D^=G||1,E=e[E]||1){q=E^E<<1^E<<2^E<<3^E<<4;q=q>>8^q&255^99;A[D]=q;B[q]=D;t=F[C=F[G=F[D]]];u=16843009*t^65537*C^257*G^16843008*D;t=257*F[q]^16843008*q;for(C=0;4>C;C++){y[C][D]=t=t<<24^t>>>8,z[C][q]=u=u<<24^u>>>8}}for(C=0;5>C;C++){y[C]=y[C].slice(0),z[C]=z[C].slice(0)}}};function ad(K,L,e){4!==L.length&&aj(new k.exception.invalid("invalid aes block size"));var q=K.b[e],t=L[0]^q[0],u=L[e?3:1]^q[1],y=L[2]^q[2];L=L[e?1:3]^q[3];var z,B,A,D=q.length/4-2,C,E=4,G=[0,0,0,0];z=K.k[e];K=z[0];var F=z[1],H=z[2],I=z[3],J=z[4];for(C=0;C<D;C++){z=K[t>>>24]^F[u>>16&255]^H[y>>8&255]^I[L&255]^q[E],B=K[u>>>24]^F[y>>16&255]^H[L>>8&255]^I[t&255]^q[E+1],A=K[y>>>24]^F[L>>16&255]^H[t>>8&255]^I[u&255]^q[E+2],L=K[L>>>24]^F[t>>16&255]^H[u>>8&255]^I[y&255]^q[E+3],E+=4,t=z,u=B,y=A}for(C=0;4>C;C++){G[e?3&-C:C]=J[t>>>24]<<24^J[u>>16&255]<<16^J[y>>8&255]<<8^J[L&255]^q[E++],z=t,t=u,u=y,y=L,L=z}return G}k.bitArray={bitSlice:function(t,u,q){t=k.bitArray.P(t.slice(u/32),32-(u&31)).slice(1);return q===ah?t:k.bitArray.clamp(t,q-u)},extract:function(u,y,q){var t=Math.floor(-y-q&31);return((y+q-1^y)&-32?u[y/32|0]<<32-t^u[y/32+1|0]>>>t:u[y/32|0]>>>t)&(1<<q)-1},concat:function(u,y){if(0===u.length||0===y.length){return u.concat(y)}var q=u[u.length-1],t=k.bitArray.getPartial(q);return 32===t?u.concat(y):k.bitArray.P(y,t,q|0,u.slice(0,u.length-1))},bitLength:function(e){var q=e.length;return 0===q?0:32*(q-1)+k.bitArray.getPartial(e[q-1])},clamp:function(t,u){if(32*t.length<u){return t}t=t.slice(0,Math.ceil(u/32));var q=t.length;u&=31;0<q&&u&&(t[q-1]=k.bitArray.partial(u,t[q-1]&2147483648>>u-1,1));return t},partial:function(t,u,q){return 32===t?u:(q?u|0:u<<32-t)+1099511627776*t},getPartial:function(e){return Math.round(e/1099511627776)||32},equal:function(u,y){if(k.bitArray.bitLength(u)!==k.bitArray.bitLength(y)){return ag}var q=0,t;for(t=0;t<u.length;t++){q|=u[t]^y[t]}return 0===q},P:function(u,y,e,q){var t;t=0;for(q===ah&&(q=[]);32<=y;y-=32){q.push(e),e=0}if(0===y){return q.concat(u)}for(t=0;t<u.length;t++){q.push(e|u[t]>>>y),e=u[t]<<32-y}t=u.length?u[u.length-1]:0;u=k.bitArray.getPartial(t);q.push(k.bitArray.partial(y+u&31,32<y+u?e:q.pop(),1));return q},l:function(e,q){return[e[0]^q[0],e[1]^q[1],e[2]^q[2],e[3]^q[3]]},byteswapM:function(t){var u,q;for(u=0;u<t.length;++u){q=t[u],t[u]=q>>>24|q>>>8&65280|(q&65280)<<8|q<<24}return t}};k.codec.utf8String={fromBits:function(u){var y="",e=k.bitArray.bitLength(u),q,t;for(q=0;q<e/8;q++){0===(q&3)&&(t=u[q/4]),y+=String.fromCharCode(t>>>24),t<<=8}return decodeURIComponent(escape(y))},toBits:function(u){u=unescape(encodeURIComponent(u));var y=[],q,t=0;for(q=0;q<u.length;q++){t=t<<8|u.charCodeAt(q),3===(q&3)&&(y.push(t),t=0)}q&3&&y.push(k.bitArray.partial(8*(q&3),t));return y}};k.codec.hex={fromBits:function(t){var u="",q;for(q=0;q<t.length;q++){u+=((t[q]|0)+263882790666240).toString(16).substr(4)}return u.substr(0,k.bitArray.bitLength(t)/4)},toBits:function(u){var y,q=[],t;u=u.replace(/\s|0x/g,"");t=u.length;u+="00000000";for(y=0;y<u.length;y+=8){q.push(parseInt(u.substr(y,8),16)^0)}return k.bitArray.clamp(q,4*t)}};k.codec.base64={J:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",fromBits:function(u,y,z){var A="",B=0,e=k.codec.base64.J,q=0,t=k.bitArray.bitLength(u);z&&(e=e.substr(0,62)+"-_");for(z=0;6*A.length<t;){A+=e.charAt((q^u[z]>>>B)>>>26),6>B?(q=u[z]<<6-B,B+=26,z++):(q<<=6,B-=6)}for(;A.length&3&&!y;){A+="="}return A},toBits:function(u,y){u=u.replace(/\s|=/g,"");var z=[],A,B=0,e=k.codec.base64.J,q=0,t;y&&(e=e.substr(0,62)+"-_");for(A=0;A<u.length;A++){t=e.indexOf(u.charAt(A)),0>t&&aj(new k.exception.invalid("this isn't base64!")),26<B?(B-=26,z.push(q^t>>>B),q=t<<32-B):(B+=6,q^=t<<32-B)}B&56&&z.push(k.bitArray.partial(B&56,q,1));return z}};k.codec.base64url={fromBits:function(e){return k.codec.base64.fromBits(e,1,1)},toBits:function(e){return k.codec.base64.toBits(e,1)}};k.hash.sha256=function(e){this.b[0]||this.D();e?(this.r=e.r.slice(0),this.o=e.o.slice(0),this.h=e.h):this.reset()};k.hash.sha256.hash=function(e){return(new k.hash.sha256).update(e).finalize()};k.hash.sha256.prototype={blockSize:512,reset:function(){this.r=this.N.slice(0);this.o=[];this.h=0;return this},update:function(t){"string"===typeof t&&(t=k.codec.utf8String.toBits(t));var u,q=this.o=k.bitArray.concat(this.o,t);u=this.h;t=this.h=u+k.bitArray.bitLength(t);for(u=512+u&-512;u<=t;u+=512){ac(this,q.splice(0,16))}return this},finalize:function(){var t,u=this.o,q=this.r,u=k.bitArray.concat(u,[k.bitArray.partial(1,1)]);for(t=u.length+2;t&15;t++){u.push(0)}u.push(Math.floor(this.h/4294967296));for(u.push(this.h|0);u.length;){ac(this,u.splice(0,16))}this.reset();return q},N:[],b:[],D:function(){function u(e){return 4294967296*(e-Math.floor(e))|0}var y=0,q=2,t;u:for(;64>y;q++){for(t=2;t*t<=q;t++){if(0===q%t){continue u}}8>y&&(this.N[y]=u(Math.pow(q,0.5)));this.b[y]=u(Math.pow(q,1/3));y++}}};function ac(u,y){var z,B,D,E=y.slice(0),F=u.r,G=u.b,I=F[0],H=F[1],q=F[2],J=F[3],A=F[4],e=F[5],C=F[6],t=F[7];for(z=0;64>z;z++){16>z?B=E[z]:(B=E[z+1&15],D=E[z+14&15],B=E[z&15]=(B>>>7^B>>>18^B>>>3^B<<25^B<<14)+(D>>>17^D>>>19^D>>>10^D<<15^D<<13)+E[z&15]+E[z+9&15]|0),B=B+t+(A>>>6^A>>>11^A>>>25^A<<26^A<<21^A<<7)+(C^A&(e^C))+G[z],t=C,C=e,e=A,A=J+B|0,J=q,q=H,H=I,I=B+(H&q^J&(H^q))+(H>>>2^H>>>13^H>>>22^H<<30^H<<19^H<<10)|0}F[0]=F[0]+I|0;F[1]=F[1]+H|0;F[2]=F[2]+q|0;F[3]=F[3]+J|0;F[4]=F[4]+A|0;F[5]=F[5]+e|0;F[6]=F[6]+C|0;F[7]=F[7]+t|0}k.mode.ccm={name:"ccm",encrypt:function(B,C,D,e,q){var t,u=C.slice(0),y=k.bitArray,A=y.bitLength(D)/8,z=y.bitLength(u)/8;q=q||64;e=e||[];7>A&&aj(new k.exception.invalid("ccm: iv must be at least 7 bytes"));for(t=2;4>t&&z>>>8*t;t++){}t<15-A&&(t=15-A);D=y.clamp(D,8*(15-t));C=k.mode.ccm.L(B,C,D,e,q,t);u=k.mode.ccm.p(B,u,D,C,q,t);return y.concat(u.data,u.tag)},decrypt:function(B,C,D,e,q){q=q||64;e=e||[];var t=k.bitArray,u=t.bitLength(D)/8,y=t.bitLength(C),A=t.clamp(C,y-q),z=t.bitSlice(C,y-q),y=(y-q)/8;7>u&&aj(new k.exception.invalid("ccm: iv must be at least 7 bytes"));for(C=2;4>C&&y>>>8*C;C++){}C<15-u&&(C=15-u);D=t.clamp(D,8*(15-C));A=k.mode.ccm.p(B,A,D,z,q,C);B=k.mode.ccm.L(B,A.data,D,e,q,C);t.equal(A.tag,B)||aj(new k.exception.corrupt("ccm: tag doesn't match"));return A.data},L:function(C,e,q,t,u,y){var z=[],A=k.bitArray,B=A.l;u/=8;(u%2||4>u||16<u)&&aj(new k.exception.invalid("ccm: invalid tag length"));(4294967295<t.length||4294967295<e.length)&&aj(new k.exception.bug("ccm: can't deal with 4GiB or more data"));y=[A.partial(8,(t.length?64:0)|u-2<<2|y-1)];y=A.concat(y,q);y[3]|=A.bitLength(e)/8;y=C.encrypt(y);if(t.length){q=A.bitLength(t)/8;65279>=q?z=[A.partial(16,q)]:4294967295>=q&&(z=A.concat([A.partial(16,65534)],[q]));z=A.concat(z,t);for(t=0;t<z.length;t+=4){y=C.encrypt(B(y,z.slice(t,t+4).concat([0,0,0])))}}for(t=0;t<e.length;t+=4){y=C.encrypt(B(y,e.slice(t,t+4).concat([0,0,0])))}return A.clamp(y,8*u)},p:function(B,C,D,e,q,t){var u,y=k.bitArray;u=y.l;var A=C.length,z=y.bitLength(C);D=y.concat([y.partial(8,t-1)],D).concat([0,0,0]).slice(0,4);e=y.bitSlice(u(e,B.encrypt(D)),0,q);if(!A){return{tag:e,data:[]}}for(u=0;u<A;u+=4){D[3]++,q=B.encrypt(D),C[u]^=q[0],C[u+1]^=q[1],C[u+2]^=q[2],C[u+3]^=q[3]}return{tag:e,data:y.clamp(C,z)}}};k.mode.ocb2={name:"ocb2",encrypt:function(y,z,A,B,C,D){128!==k.bitArray.bitLength(A)&&aj(new k.exception.invalid("ocb iv must be 128 bits"));var E,F=k.mode.ocb2.H,e=k.bitArray,G=e.l,t=[0,0,0,0];A=F(y.encrypt(A));var q,u=[];B=B||[];C=C||64;for(E=0;E+4<z.length;E+=4){q=z.slice(E,E+4),t=G(t,q),u=u.concat(G(A,y.encrypt(G(A,q)))),A=F(A)}q=z.slice(E);z=e.bitLength(q);E=y.encrypt(G(A,[0,0,0,z]));q=e.clamp(G(q.concat([0,0,0]),E),z);t=G(t,G(q.concat([0,0,0]),E));t=y.encrypt(G(t,G(A,F(A))));B.length&&(t=G(t,D?B:k.mode.ocb2.pmac(y,B)));return u.concat(e.concat(q,e.clamp(t,C)))},decrypt:function(t,u,z,B,C,D){128!==k.bitArray.bitLength(z)&&aj(new k.exception.invalid("ocb iv must be 128 bits"));C=C||64;var E=k.mode.ocb2.H,F=k.bitArray,H=F.l,G=[0,0,0,0],e=E(t.encrypt(z)),I,y,q=k.bitArray.bitLength(u)-C,A=[];B=B||[];for(z=0;z+4<q/32;z+=4){I=H(e,t.decrypt(H(e,u.slice(z,z+4)))),G=H(G,I),A=A.concat(I),e=E(e)}y=q-32*z;I=t.encrypt(H(e,[0,0,0,y]));I=H(I,F.clamp(u.slice(z),y).concat([0,0,0]));G=H(G,I);G=t.encrypt(H(G,H(e,E(e))));B.length&&(G=H(G,D?B:k.mode.ocb2.pmac(t,B)));F.equal(F.clamp(G,C),F.bitSlice(u,q))||aj(new k.exception.corrupt("ocb: tag doesn't match"));return A.concat(F.clamp(I,y))},pmac:function(u,y){var z,A=k.mode.ocb2.H,B=k.bitArray,e=B.l,q=[0,0,0,0],t=u.encrypt([0,0,0,0]),t=e(t,A(A(t)));for(z=0;z+4<y.length;z+=4){t=A(t),q=e(q,u.encrypt(e(t,y.slice(z,z+4))))}z=y.slice(z);128>B.bitLength(z)&&(t=e(t,A(t)),z=B.concat(z,[-2147483648,0,0,0]));q=e(q,z);return u.encrypt(e(A(e(t,A(t))),q))},H:function(e){return[e[0]<<1^e[1]>>>31,e[1]<<1^e[2]>>>31,e[2]<<1^e[3]>>>31,e[3]<<1^135*(e[0]>>>31)]}};k.mode.gcm={name:"gcm",encrypt:function(y,z,e,q,t){var u=z.slice(0);z=k.bitArray;q=q||[];y=k.mode.gcm.p(!0,y,u,q,e,t||128);return z.concat(y.data,y.tag)},decrypt:function(u,y,z,A,B){var e=y.slice(0),q=k.bitArray,t=q.bitLength(e);B=B||128;A=A||[];B<=t?(y=q.bitSlice(e,t-B),e=q.bitSlice(e,0,t-B)):(y=e,e=[]);u=k.mode.gcm.p(ag,u,e,A,z,B);q.equal(u.tag,y)||aj(new k.exception.corrupt("gcm: tag doesn't match"));return u.data},Z:function(u,y){var z,A,B,e,q,t=k.bitArray.l;B=[0,0,0,0];e=y.slice(0);for(z=0;128>z;z++){(A=0!==(u[Math.floor(z/32)]&1<<31-z%32))&&(B=t(B,e));q=0!==(e[3]&1);for(A=3;0<A;A--){e[A]=e[A]>>>1|(e[A-1]&1)<<31}e[0]>>>=1;q&&(e[0]^=-520093696)}return B},g:function(u,y,e){var q,t=e.length;y=y.slice(0);for(q=0;q<t;q+=4){y[0]^=4294967295&e[q],y[1]^=4294967295&e[q+1],y[2]^=4294967295&e[q+2],y[3]^=4294967295&e[q+3],y=k.mode.gcm.Z(y,u)}return y},p:function(t,u,z,B,C,D){var E,F,H,G,e,I,y,q,A=k.bitArray;I=z.length;y=A.bitLength(z);q=A.bitLength(B);F=A.bitLength(C);E=u.encrypt([0,0,0,0]);96===F?(C=C.slice(0),C=A.concat(C,[1])):(C=k.mode.gcm.g(E,[0,0,0,0],C),C=k.mode.gcm.g(E,C,[0,0,Math.floor(F/4294967296),F&4294967295]));F=k.mode.gcm.g(E,[0,0,0,0],B);e=C.slice(0);
B=F.slice(0);t||(B=k.mode.gcm.g(E,F,z));for(G=0;G<I;G+=4){e[3]++,H=u.encrypt(e),z[G]^=H[0],z[G+1]^=H[1],z[G+2]^=H[2],z[G+3]^=H[3]}z=A.clamp(z,y);t&&(B=k.mode.gcm.g(E,F,z));t=[Math.floor(q/4294967296),q&4294967295,Math.floor(y/4294967296),y&4294967295];B=k.mode.gcm.g(E,B,t);H=u.encrypt(C);B[0]^=H[0];B[1]^=H[1];B[2]^=H[2];B[3]^=H[3];return{tag:A.bitSlice(B,0,D),data:z}}};k.misc.hmac=function(u,y){this.M=y=y||k.hash.sha256;var e=[[],[]],q,t=y.prototype.blockSize/32;this.n=[new y,new y];u.length>t&&(u=y.hash(u));for(q=0;q<t;q++){e[0][q]=u[q]^909522486,e[1][q]=u[q]^1549556828}this.n[0].update(e[0]);this.n[1].update(e[1]);this.G=new y(this.n[0])};k.misc.hmac.prototype.encrypt=k.misc.hmac.prototype.mac=function(e){this.Q&&aj(new k.exception.invalid("encrypt on already updated hmac called!"));this.update(e);return this.digest(e)};k.misc.hmac.prototype.reset=function(){this.G=new this.M(this.n[0]);this.Q=ag};k.misc.hmac.prototype.update=function(e){this.Q=!0;this.G.update(e)};k.misc.hmac.prototype.digest=function(){var e=this.G.finalize(),e=(new this.M(this.n[1])).update(e).finalize();this.reset();return e};k.misc.pbkdf2=function(A,B,C,D,E){C=C||1000;(0>D||0>C)&&aj(k.exception.invalid("invalid params to pbkdf2"));"string"===typeof A&&(A=k.codec.utf8String.toBits(A));"string"===typeof B&&(B=k.codec.utf8String.toBits(B));E=E||k.misc.hmac;A=new E(A);var e,q,t,y,u=[],z=k.bitArray;for(y=1;32*u.length<(D||1);y++){E=e=A.encrypt(z.concat(B,[y]));for(q=1;q<C;q++){e=A.encrypt(e);for(t=0;t<e.length;t++){E[t]^=e[t]}}u=u.concat(E)}D&&(u=z.clamp(u,D));return u};k.prng=function(e){this.c=[new k.hash.sha256];this.i=[0];this.F=0;this.s={};this.C=0;this.K={};this.O=this.d=this.j=this.W=0;this.b=[0,0,0,0,0,0,0,0];this.f=[0,0,0,0];this.A=ah;this.B=e;this.q=ag;this.w={progress:{},seeded:{}};this.m=this.V=0;this.t=1;this.u=2;this.S=65536;this.I=[0,48,64,96,128,192,256,384,512,768,1024];this.T=30000;this.R=80};k.prng.prototype={randomWords:function(y,z){var A=[],e;e=this.isReady(z);var q;e===this.m&&aj(new k.exception.notReady("generator isn't seeded"));if(e&this.u){e=!(e&this.t);q=[];var t=0,u;this.O=q[0]=(new Date).valueOf()+this.T;for(u=0;16>u;u++){q.push(4294967296*Math.random()|0)}for(u=0;u<this.c.length&&!(q=q.concat(this.c[u].finalize()),t+=this.i[u],this.i[u]=0,!e&&this.F&1<<u);u++){}this.F>=1<<this.c.length&&(this.c.push(new k.hash.sha256),this.i.push(0));this.d-=t;t>this.j&&(this.j=t);this.F++;this.b=k.hash.sha256.hash(this.b.concat(q));this.A=new k.cipher.aes(this.b);for(e=0;4>e&&!(this.f[e]=this.f[e]+1|0,this.f[e]);e++){}}for(e=0;e<y;e+=4){0===(e+1)%this.S&&aP(this),q=aO(this),A.push(q[0],q[1],q[2],q[3])}aP(this);return A.slice(0,y)},setDefaultParanoia:function(e,q){0===e&&"Setting paranoia=0 will ruin your security; use it only for testing"!==q&&aj("Setting paranoia=0 will ruin your security; use it only for testing");this.B=e},addEntropy:function(C,e,q){q=q||"user";var t,u,y=(new Date).valueOf(),z=this.s[q],A=this.isReady(),B=0;t=this.K[q];t===ah&&(t=this.K[q]=this.W++);z===ah&&(z=this.s[q]=0);this.s[q]=(this.s[q]+1)%this.c.length;switch(typeof C){case"number":e===ah&&(e=1);this.c[z].update([t,this.C++,1,e,y,1,C|0]);break;case"object":q=Object.prototype.toString.call(C);if("[object Uint32Array]"===q){u=[];for(q=0;q<C.length;q++){u.push(C[q])}C=u}else{"[object Array]"!==q&&(B=1);for(q=0;q<C.length&&!B;q++){"number"!==typeof C[q]&&(B=1)}}if(!B){if(e===ah){for(q=e=0;q<C.length;q++){for(u=C[q];0<u;){e++,u>>>=1}}}this.c[z].update([t,this.C++,2,e,y,C.length].concat(C))}break;case"string":e===ah&&(e=C.length);this.c[z].update([t,this.C++,3,e,y,C.length]);this.c[z].update(C);break;default:B=1}B&&aj(new k.exception.bug("random: addEntropy only supports number, array of numbers or string"));this.i[z]+=e;this.d+=e;A===this.m&&(this.isReady()!==this.m&&aN("seeded",Math.max(this.j,this.d)),aN("progress",this.getProgress()))},isReady:function(e){e=this.I[e!==ah?e:this.B];return this.j&&this.j>=e?this.i[0]>this.R&&(new Date).valueOf()>this.O?this.u|this.t:this.t:this.d>=e?this.u|this.m:this.m},getProgress:function(e){e=this.I[e?e:this.B];return this.j>=e?1:this.d>e?1:this.d/e},startCollectors:function(){this.q||(this.a={loadTimeCollector:aL(this,this.aa),mouseCollector:aL(this,this.ba),keyboardCollector:aL(this,this.$),accelerometerCollector:aL(this,this.U)},window.addEventListener?(window.addEventListener("load",this.a.loadTimeCollector,ag),window.addEventListener("mousemove",this.a.mouseCollector,ag),window.addEventListener("keypress",this.a.keyboardCollector,ag),window.addEventListener("devicemotion",this.a.accelerometerCollector,ag)):document.attachEvent?(document.attachEvent("onload",this.a.loadTimeCollector),document.attachEvent("onmousemove",this.a.mouseCollector),document.attachEvent("keypress",this.a.keyboardCollector)):aj(new k.exception.bug("can't attach event")),this.q=!0)},stopCollectors:function(){this.q&&(window.removeEventListener?(window.removeEventListener("load",this.a.loadTimeCollector,ag),window.removeEventListener("mousemove",this.a.mouseCollector,ag),window.removeEventListener("keypress",this.a.keyboardCollector,ag),window.removeEventListener("devicemotion",this.a.accelerometerCollector,ag)):document.detachEvent&&(document.detachEvent("onload",this.a.loadTimeCollector),document.detachEvent("onmousemove",this.a.mouseCollector),document.detachEvent("keypress",this.a.keyboardCollector)),this.q=ag)},addEventListener:function(e,q){this.w[e][this.V++]=q},removeEventListener:function(y,z){var e,q,t=this.w[y],u=[];for(q in t){t.hasOwnProperty(q)&&t[q]===z&&u.push(q)}for(e=0;e<u.length;e++){q=u[e],delete t[q]}},$:function(){aK(1)},ba:function(u){var y,q;try{y=u.x||u.clientX||u.offsetX||0,q=u.y||u.clientY||u.offsetY||0}catch(t){q=y=0}0!=y&&0!=q&&k.random.addEntropy([y,q],2,"mouse");aK(0)},aa:function(){aK(2)},U:function(e){e=(e.accelerationIncludingGravity||{}).x||(e.accelerationIncludingGravity||{}).y||(e.accelerationIncludingGravity||{}).z;if(window.orientation){var q=window.orientation;"number"===typeof q&&k.random.addEntropy(q,1,"accelerometer")}e&&k.random.addEntropy(e,2,"accelerometer");aK(0)}};function aN(u,y){var e,q=k.random.w[u],t=[];for(e in q){q.hasOwnProperty(e)&&t.push(q[e])}for(e=0;e<t.length;e++){t[e](y)}}function aK(e){"undefined"!==typeof window&&window.performance&&"function"===typeof window.performance.now?k.random.addEntropy(window.performance.now(),e,"loadtime"):k.random.addEntropy((new Date).valueOf(),e,"loadtime")}function aP(e){e.b=aO(e).concat(aO(e));e.A=new k.cipher.aes(e.b)}function aO(e){for(var q=0;4>q&&!(e.f[q]=e.f[q]+1|0,e.f[q]);q++){}return e.A.encrypt(e.f)}function aL(e,q){return function(){q.apply(e,arguments)}}k.random=new k.prng(6);a:try{var aJ,aH,aG,aF;if(aF="undefined"!==typeof module){var aE;if(aE=module.exports){var aD;try{aD=require("crypto")}catch(aC){aD=null}aE=(aH=aD)&&aH.randomBytes}aF=aE}if(aF){aJ=aH.randomBytes(128),aJ=new Uint32Array((new Uint8Array(aJ)).buffer),k.random.addEntropy(aJ,1024,"crypto['randomBytes']")}else{if("undefined"!==typeof window&&"undefined"!==typeof Uint32Array){aG=new Uint32Array(32);if(window.crypto&&window.crypto.getRandomValues){window.crypto.getRandomValues(aG)}else{if(window.msCrypto&&window.msCrypto.getRandomValues){window.msCrypto.getRandomValues(aG)}else{break a}}k.random.addEntropy(aG,1024,"crypto['getRandomValues']")}}}catch(aB){"undefined"!==typeof window&&window.console&&(console.log("There was an error collecting entropy from the browser:"),console.log(aB))}k.json={defaults:{v:1,iter:1000,ks:128,ts:64,mode:"ccm",adata:"",cipher:"aes"},Y:function(y,z,A,e){A=A||{};e=e||{};var q=k.json,t=q.e({iv:k.random.randomWords(4,0)},q.defaults),u;q.e(t,A);A=t.adata;"string"===typeof t.salt&&(t.salt=k.codec.base64.toBits(t.salt));"string"===typeof t.iv&&(t.iv=k.codec.base64.toBits(t.iv));(!k.mode[t.mode]||!k.cipher[t.cipher]||"string"===typeof y&&100>=t.iter||64!==t.ts&&96!==t.ts&&128!==t.ts||128!==t.ks&&192!==t.ks&&256!==t.ks||2>t.iv.length||4<t.iv.length)&&aj(new k.exception.invalid("json encrypt: invalid parameters"));"string"===typeof y?(u=k.misc.cachedPbkdf2(y,t),y=u.key.slice(0,t.ks/32),t.salt=u.salt):k.ecc&&y instanceof k.ecc.elGamal.publicKey&&(u=y.kem(),t.kemtag=u.tag,y=u.key.slice(0,t.ks/32));"string"===typeof z&&(z=k.codec.utf8String.toBits(z));"string"===typeof A&&(A=k.codec.utf8String.toBits(A));u=new k.cipher[t.cipher](y);q.e(e,t);e.key=y;t.ct=k.mode[t.mode].encrypt(u,z,t.iv,A,t.ts);return t},encrypt:function(y,z,e,q){var t=k.json,u=t.Y.apply(t,arguments);return t.encode(u)},X:function(y,z,A,e){A=A||{};e=e||{};var q=k.json;z=q.e(q.e(q.e({},q.defaults),z),A,!0);var t,u;t=z.adata;"string"===typeof z.salt&&(z.salt=k.codec.base64.toBits(z.salt));"string"===typeof z.iv&&(z.iv=k.codec.base64.toBits(z.iv));(!k.mode[z.mode]||!k.cipher[z.cipher]||"string"===typeof y&&100>=z.iter||64!==z.ts&&96!==z.ts&&128!==z.ts||128!==z.ks&&192!==z.ks&&256!==z.ks||!z.iv||2>z.iv.length||4<z.iv.length)&&aj(new k.exception.invalid("json decrypt: invalid parameters"));"string"===typeof y?(u=k.misc.cachedPbkdf2(y,z),y=u.key.slice(0,z.ks/32),z.salt=u.salt):k.ecc&&y instanceof k.ecc.elGamal.secretKey&&(y=y.unkem(k.codec.base64.toBits(z.kemtag)).slice(0,z.ks/32));"string"===typeof t&&(t=k.codec.utf8String.toBits(t));u=new k.cipher[z.cipher](y);t=k.mode[z.mode].decrypt(u,z.ct,z.iv,t,z.ts);q.e(e,z);e.key=y;return 1===A.raw?t:k.codec.utf8String.fromBits(t)},decrypt:function(u,y,e,q){var t=k.json;return t.X(u,t.decode(y),e,q)},encode:function(u){var y,q="{",t="";for(y in u){if(u.hasOwnProperty(y)){switch(y.match(/^[a-z0-9]+$/i)||aj(new k.exception.invalid("json encode: invalid property name")),q+=t+'"'+y+'":',t=",",typeof u[y]){case"number":case"boolean":q+=u[y];break;case"string":q+='"'+escape(u[y])+'"';break;case"object":q+='"'+k.codec.base64.fromBits(u[y],0)+'"';break;default:aj(new k.exception.bug("json encode: unsupported type"))}}}return q+"}"},decode:function(u){u=u.replace(/\s/g,"");u.match(/^\{.*\}$/)||aj(new k.exception.invalid("json decode: this isn't json!"));u=u.replace(/^\{|\}$/g,"").split(/,/);var y={},q,t;for(q=0;q<u.length;q++){(t=u[q].match(/^(?:(["']?)([a-z][a-z0-9]*)\1):(?:(\d+)|"([a-z0-9+\/%*_.@=\-]*)")$/i))||aj(new k.exception.invalid("json decode: this isn't json!")),y[t[2]]=t[3]?parseInt(t[3],10):t[2].match(/^(ct|salt|iv)$/)?k.codec.base64.toBits(t[4]):unescape(t[4])}return y},e:function(u,y,q){u===ah&&(u={});if(y===ah){return u}for(var t in y){y.hasOwnProperty(t)&&(q&&(u[t]!==ah&&u[t]!==y[t])&&aj(new k.exception.invalid("required parameter overridden")),u[t]=y[t])}return u},ea:function(u,y){var q={},t;for(t in u){u.hasOwnProperty(t)&&u[t]!==y[t]&&(q[t]=u[t])}return q},da:function(u,y){var q={},t;for(t=0;t<y.length;t++){u[y[t]]!==ah&&(q[y[t]]=u[y[t]])}return q}};k.encrypt=k.json.encrypt;k.decrypt=k.json.decrypt;k.misc.ca={};k.misc.cachedPbkdf2=function(u,y){var q=k.misc.ca,t;y=y||{};t=y.iter||1000;q=q[u]=q[u]||{};t=q[t]=q[t]||{firstSalt:y.salt&&y.salt.length?y.salt.slice(0):k.random.randomWords(2,0)};q=y.salt===ah?t.firstSalt:y.salt;t[q]=t[q]||k.misc.pbkdf2(u,q,y.iter);return{key:t[q].slice(0),salt:q.slice(0)}};(function(q){var e=q.codec.bytes=q.codec.bytes||{};e.fromBits=e.fromBits||function(A){var z=[],t=q.bitArray.bitLength(A),u,y;for(u=0;u<t/8;u++){if((u&3)===0){y=A[u/4]}z.push(y>>>24);y<<=8}return z};e.toBits=e.toBits||function(z){var y=[],t,u=0;for(t=0;t<z.length;t++){u=u<<8|z[t];if((t&3)===3){y.push(u);u=0}}if(t&3){y.push(q.bitArray.partial(8*(t&3),u))}return y}}(k));var p;(function(){var q=new Date().getTime();function t(z,y,u,A){if(typeof z.addEventListener==="function"){z.addEventListener(y,u,A)}else{if(z.attachEvent){z.attachEvent("on"+y,u)}else{throw new Error(a6.errors.UNABLETOBIND+": Unable to bind "+y+"-event")}}}p=p||(function(){var u={};return function(z,A,D){if(z==="bind"){p(D+"Bind");t(A,"change",function(F){p(D+"FieldChangeCount");p("log",D,"ch");try{p("set",D+"FieldEvHa",e(A))}catch(E){p("set",D+"FieldEvHa","Err")}},true);t(A,"click",function(){p(D+"FieldClickCount");p("log",D,"cl")},true);t(A,"focus",function(){p(D+"FieldFocusCount");p("log",D,"fo")},true);t(A,"blur",function(){p(D+"FieldBlurCount");p("log",D,"bl")},true);t(A,"touchstart",function(){p(D+"FieldTouchStartCount");p("log",D,"Ts")},true);t(A,"touchend",function(){p(D+"FieldTouchEndCount");p("log",D,"Te")},true);t(A,"touchcancel",function(){p(D+"FieldTouchCancelCount");p("log",D,"Tc")},true);t(A,"keyup",function(E){if(E.keyCode==16){p("log",D,"Su")}else{if(E.keyCode==17){p("log",D,"Cu")}else{if(E.keyCode==18){p("log",D,"Au")}}}});t(A,"keydown",function(E){p(D+"FieldKeyCount");switch(E&&E.keyCode){case 8:p("log",D,"Kb");break;case 16:p("log",D,"Sd");break;case 17:p("log",D,"Cd");break;case 18:p("log",D,"Ad");break;case 37:p("log",D,"Kl");break;case 39:p("log",D,"Kr");break;case 46:p("log",D,"Kd");break;case 32:p("log",D,"Ks");break;default:if(E.keyCode>=48&&E.keyCode<=57||E.keyCode>=96&&E.keyCode<=105){p("log",D,"KN")}else{if(E.keyCode>=65&&E.keyCode<=90){p("log",D,"KL")}else{p("log",D,"KU");p("log",D+"UnkKeys",E.keyCode)}}break}},true);return}if(z==="set"){u[A]=D;return}if(z==="log"){var y=A+"FieldLog";var C=(new Date().getTime())-q;C=Math.round(C/100);if(!u.hasOwnProperty(y)){u[y]=D+"@"+C}else{u[y]+=","+D+"@"+C}if(u[y].length>1500){u[y]=u[y].substring(u[y].length-1500);u[y]=u[y].substring(u[y].indexOf(",")+1)}return}if(z==="extend"){for(var B in u){if(B==="number"||B==="expiryMonth"||B==="expiryYear"||B==="generationtime"||B==="holderName"||B==="cvc"){continue}if(u.hasOwnProperty(B)){A[B]=""+u[B]}}return}if(!u.hasOwnProperty(z)){u[z]=1}else{u[z]++}}})();function e(F){var A=function(){return{}};if(window.jQuery&&typeof window.jQuery._data=="function"){A=function(u){return window.jQuery._data(u,"events")}}var B=F,L=0,z=[],M=["onmousedown","onmouseup","onmouseover","onmouseout","onclick","onmousemove","ondblclick","onerror","onresize","onscroll","onkeydown","onkeyup","onkeypress","onchange","onsubmit"],E="Own",br="Par",bq=M.length;var G=0;while(B&&B!==B.documentElement){G++;var C=bq,I,D,H=(B.nodeName||B.tagName||"").toUpperCase().substring(0,3);while(C--){I=M[C];if(B[name]){I=I+((B===F)?E:br)+H;L++;z[I]=z[I]||0;z[I]++}}var y=A(B);if(typeof y==="object"){for(var I in y){if(y.hasOwnProperty(I)){D=y[I].length;I=I+((B===F)?E:br)+H;z[I]=z[I]||0;z[I]+=D;L+=D}}}if(!B.parentNode){break}B=B.parentNode}var K=["total="+L];for(var J in z){if(z.hasOwnProperty(J)&&z[J]>0){K.push(J+"="+z[J])}}return K.join("&")}if(window&&(window.attachEvent||window.addEventListener)){t(window,"focus",function(){p("activate");if(window.location&&typeof window.location.href=="string"){p("set","referrer",window.location.href)}});t(window,"blur",function(){p("deactivate")})}}());var ay=bd.adyen=bd.adyen||{};var a6=ay.encrypt=ay.encrypt||{createEncryption:function(q,e){return new a3(q,e)}};if(typeof aw==="function"&&aw.amd){aw("adyen/encrypt",[],function(){return a6})}else{if(typeof module!=="undefined"&&module.exports){module.exports=a6}}a6.errors=a6.errors||{};a6.version="0_1_20_1";var aZ={};aZ.luhnCheck=(function(){var e={};return function(){var y=arguments;var q=arguments.length;var E=q>0?y[0]:this.cardnumber;if(isNaN(parseInt(E,10))){return false}var t=E.length;var C=t&1;var A=0;if(typeof e[E]==="undefined"){if(t>=14){p("luhnCount")}for(var z=0;z<t;z++){var D=parseInt(E.charAt(z),10);if(!((z&1)^C)){D*=2;if(D>9){D-=9}}A+=D}if(A%10===0){p("luhnOkCount");e[E]=true}else{p("luhnFailCount");e[E]=false}}var B=0;for(var u in e){if(e.hasOwnProperty(u)&&u.length===t){B++}}p("set","luhnSameLengthCount",B);return e[E]}})();aZ.numberCheck=function(e){return((e||"").replace(/[^\d]/g,"").match(/^\d{10,20}$/)&&aZ.luhnCheck(e))?true:false};aZ.cvcCheck=function(e){return(e&&e.match&&e.match(/^\d{3,4}$/))?true:false};aZ.yearCheck=function(t){if(!t||!t.match||!t.match(/^2\d{3}$/)){return false}var q=parseInt(t,10),e=(new Date()).getFullYear();return q>=e-2&&q<=e+15};aZ.monthCheck=function(e){var q=(e||"").replace(/^0(\d)$/,"$1");return(q.match(/^([1-9]|10|11|12)$/)&&parseInt(q,10)>=1&&parseInt(q,10)<=12)?true:false};aZ.holderNameCheck=function(e){return(e&&e.match&&e.match(/\S/))?true:false};aZ.generationTimeValidDate=function(q){if(typeof q!=="string"){return false}var e=q.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);return(e&&(""+e[1]).match(/^20[1-9][0-9]$/)&&(""+e[2]).match(/^(12|11|10|0[1-9])$/)&&(""+e[3]).match(/^(31|30|20|10|[012][1-9])$/))?true:false};aZ.generationTimeValidTime=function(t){if(typeof t!=="string"){return false}var q=/(Z|[\+\-][012345][0-9]:?[012345][0-9])$/;if(!t.match(q)){return false}var e=t.replace(q,"").replace(/\.\d{3}$/,"");return e.match(/^[012345][0-9]:?[012345][0-9]:?[012345][0-9]$/)};aZ.generationTimeCheck=function(q){if(typeof q!=="string"){return false}var e=q.split("T");return(e.length===2&&aZ.generationTimeValidDate(e[0])&&aZ.generationTimeValidTime(e[1]))?true:false};var a3=function(u,t){try{k.random.startCollectors()}catch(y){}try{T()}catch(y){}this.key=u;this.options=t||{};if(typeof this.options.numberIgnoreNonNumeric==="undefined"){this.options.numberIgnoreNonNumeric=true}if(typeof this.options.cvcIgnoreFornumber!=="undefined"){delete this.options.cvcIgnoreFornumber}if(typeof this.options.fourDigitCvcForBins==="undefined"){this.options.fourDigitCvcForBins="34,37"}if(typeof this.options.cvcLengthFornumber!=="undefined"){delete this.options.cvcLengthFornumber}if(typeof this.options.cvcIgnoreBins==="string"){var z=[];this.options.cvcIgnoreBins.replace(/\d+/g,function(e){if(e.length>0&&!isNaN(parseInt(e,10))){z.push(e)}return e});if(z.length>0){this.options.cvcIgnoreFornumber=new RegExp("^\\s*("+z.join("|")+")")}}else{if(typeof this.options.cvcIgnoreBins!=="undefined"){delete this.options.cvcIgnoreBins}}if(typeof this.options.fourDigitCvcForBins==="string"){var q=[];this.options.fourDigitCvcForBins.replace(/\d+/g,function(e){if(e.length>0&&!isNaN(parseInt(e,10))){q.push(e)}return e});if(q.length>0){this.options.cvcLengthFornumber={matcher:new RegExp("^\\s*("+q.join("|")+")"),requiredLength:4}}}delete this.options.fourDigitCvcForBins;p("initializeCount")};a3.prototype.createRSAKey=function(){var e=this.key.split("|");if(e.length!==2){throw"Malformed public key"}var u=e[0];var q=e[1];var t=new al();t.setPublic(q,u);return t};a3.prototype.createAESKey=function(){return new bm()};a3.prototype.encrypt=function(q){var t={};for(var u in q){if(q.hasOwnProperty(u)){t[u]=q[u]}}var B,F,C,E,A,z,y={};if(typeof t.number!=="undefined"){y.number=t.number}if(typeof t.cvc!=="undefined"){y.cvc=t.cvc}if(typeof t.expiryMonth!=="undefined"){y.month=t.expiryMonth}if(typeof t.expiryYear!=="undefined"){y.year=t.expiryYear}if(typeof t.holderName!=="undefined"){y.holderName=t.holderName}if(typeof t.generationtime!=="undefined"){y.generationtime=t.generationtime}if(this.options.enableValidations!==false&&this.validate(y).valid===false){return false}for(var G=0;G<11;G++){if(k.random&&k.random.isReady(G)){p("set","sjclStrength",G)}else{break}}p("extend",t);try{t.dfValue=T()}catch(D){}B=this.createRSAKey();F=this.createAESKey();C=F.encrypt(JSON.stringify(t));E=k.codec.bytes.fromBits(F.key());A=B.encrypt_b64(E);z="adyenjs_"+a6.version+"$";return[z,A,"$",C].join("")};a3.prototype.validate=function(u){var e={};e.valid=true;if(typeof u!=="object"){e.valid=false;return e}for(var y in u){if(!u.hasOwnProperty(y)||typeof u[y]==="undefined"){continue}var A=u[y];if(this.options[y+"IgnoreNonNumeric"]){A=A.replace(/\D/g,"")}if(this.options[y+"SkipValidation"]){continue}for(var t in u){if(u.hasOwnProperty(t)){var q=this.options[y+"IgnoreFor"+t];var z=this.options[y+"LengthFor"+t];if(q&&u[t].match(q)){e[y]=true;continue}else{if(z&&z.matcher&&z.requiredLength&&u[t].match(z.matcher)){if(A.length!==z.requiredLength){e[y]=false;continue}}}}}if(e.hasOwnProperty(y)){e.valid=e.valid&&e[y];continue}switch(y){case"number":e.number=aZ.numberCheck(A);e.luhn=e.number;e.valid=e.valid&&e.number;break;case"expiryYear":case"year":e.year=aZ.yearCheck(A);e.expiryYear=e.year;e.valid=e.valid&&e.year;break;case"cvc":e.cvc=aZ.cvcCheck(A);e.valid=e.valid&&e.cvc;break;case"expiryMonth":case"month":e.month=aZ.monthCheck(A);e.expiryMonth=e.month;e.valid=e.valid&&e.month;break;case"holderName":e.holderName=aZ.holderNameCheck(A);e.valid=e.valid&&e.holderName;break;case"generationtime":e.generationtime=aZ.generationTimeCheck(A);e.valid=e.valid&&e.generationtime;break;default:e.unknown=e.unknown||[];e.unknown.push(y);e.valid=false}}return e};a3.prototype.monitor=function(q,e){if(typeof q!=="string"||(q!=="number"&&q!=="cvc"&&q!=="holderName")){throw new Error("invalid fieldname. Expected 'number', 'cvc' or 'holderName', but received '"+q+"'")}p("bind",e,q)};var bm=function(){};bm.prototype={constructor:bm,key:function(){this._key=this._key||k.random.randomWords(8,6);return this._key},encrypt:function(e){return this.encryptWithIv(e,k.random.randomWords(3,6))},encryptWithIv:function(z,q){var t,u,e,y;t=new k.cipher.aes(this.key());u=k.codec.utf8String.toBits(z);e=k.mode.ccm.encrypt(t,u,q);y=k.bitArray.concat(q,e);return k.codec.base64.fromBits(y)}}})(this,typeof define==="function"?define:null);;
var Tesla = window.Tesla || {};

Tesla.Adyen = (function (window, Drupal, adyen) {
  'use strict';

  return {
      /**
       * encrypts payload with Adyen key
       *
       * @param {object} card ~ object with keys {number, name, cvc, month, year}
       * @returns {string|boolean} ~ false if validation failed, string with encrypted data
       */
      encrypt: function (card, key) {
          var key = key !== undefined ? key : Drupal.settings.tesla.payments.adyen_key || '';
          var cseInstance = adyen.encrypt.createEncryption(key, {numberIgnoreNonNumeric: false});

          return cseInstance.encrypt({
              number: '' + card.number || '',
              cvc: '' + card.cvc || '0',
              holderName: '' + card.name || '',
              expiryMonth: '' + card.month || '0',
              expiryYear: '' + card.year || '0',
              generationtime: Drupal.settings.tesla.payments.adyen_time
          });
      },

      /**
       * returns if country is adyen enabled
       *
       * @param {string} country
       * @returns {boolean}
       */
      isCountryEnabled: function(country) {
          if (typeof Drupal.settings.tesla.payments !== 'undefined' && typeof Drupal.settings.tesla.payments.adyen_countries !== 'undefined') {
              return Drupal.settings.tesla.payments.adyen_countries.indexOf(country) !== -1;
          }
          return false;
      },

      /**
       * Returns credit card type
       *
       * @param {string} creditCardNumber ~ cc #
       * @param {boolean} returnInUppercase ~ if no provided then its true
       * @param {string} country ~ country code
       * @return {string}
       */
      getCreditCardType: function (creditCardNumber, returnInUppercase, country) {
          var countryCode = typeof country !== 'undefined' ? country : Drupal.settings.tesla.country,
              shouldBeUppercased = typeof returnInUppercase !== 'undefined' ? returnInUppercase : true;

          // card types
          var jcbRegex = new RegExp('^(?:2131|1800|35)[0-9]{0,}$'),
              amexRegex = new RegExp('^3[47][0-9]{0,}$'),
              dinersRegex = new RegExp('^3(?:0[0-59]{1}|[689])[0-9]{0,}$'),
              visaRegex = new RegExp('^4[0-9]{0,}$'),
              mastercardRegex = new RegExp('^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)[0-9]{0,}$'),
              discoverRegex = new RegExp('^(6011|65|64[4-9]|62212[6-9]|6221[3-9]|622[2-8]|6229[01]|62292[0-5])[0-9]{0,}$'),
              unionRegex = new RegExp('^((62|88)[0-9]{14,17})$'),
              cardType = 'None';

          if (creditCardNumber.match(jcbRegex)) {
              cardType = 'JCB';
          } else if (creditCardNumber.match(amexRegex)) {
              cardType = 'Amex';
          } else if (creditCardNumber.match(visaRegex)) {
              cardType = 'Visa';
          } else if (creditCardNumber.match(mastercardRegex)) {
              cardType = 'MasterCard';
          } else if (creditCardNumber.match(discoverRegex)) {
              cardType = 'Discover';
          } else if (creditCardNumber.match(dinersRegex)) {
              cardType = 'Diners';
          } else if ((countryCode === 'US' || countryCode === 'CA') && creditCardNumber.match(unionRegex)) {
              cardType = 'Union';
          }

          return shouldBeUppercased ? cardType.toUpperCase() : cardType;
      }
  };

}(window, Drupal, window.adyen));
;