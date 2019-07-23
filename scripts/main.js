//Included on every page. Sets up variables and runs browsers.js, footer.js, navigation.js, and settings.js.


var window_width, window_height;

var page_settings = {};

var page_settings_done = false;

var current_url = "/";
var parent_folder = "/";

//Whether the browser supports WebP images or not. Given a boolean value when decided.
var supports_webp = null;

//Whether Disqus has been loaded for the first time or not. We need to use a different function if it's not the first time.
var loaded_disqus = false;



$(function()
{
	window_width = $(window).width();
	window_height = $(window).height();
	
	
	
	set_font_size();
	
	
	
	//Disable the default behavior of <a> tags -- that's only there for accessibility.
	$("body").on("click", "a:not(.real-link)", function(e)
	{
		e.preventDefault();
	});
	
	
	
	//When in PWA form, disable text selection, drag-and-drop, and the PWA button itself.
	if (window.matchMedia("(display-mode: standalone)").matches)
	{
		$("html").css("-webkit-user-select", "none");
		$("html").css("user-select", "none");
		$("html").css("-webkit-touch-callout", "none");
		$("*").attr("draggable", "false");
		
		
		
		//Also add a little extra spacing at the top of each page to keep content from feeling too close to the top of the screen.
		$("head").append(`
			<style class="permanent-style">
				#pwa-button
				{
					display: none;
					width: 0px;
					height: 0px;
				}
				
				.logo, .name-text-container, .empty-top
				{
					margin-top: 2vh;
				}
			</style>
		`);
	}
	
	
	
	$.getScript("/scripts/modernizr-webp.js", function()
	{
		Modernizr.on("webp", function(result)
		{
			if (result)
			{
				supports_webp = true;
			}
			
			else
			{
				supports_webp = false;
			}
		});
	});
});



function set_font_size()
{
	var font_size = .0065 * window_width + .0065 * window_height;
	
	if (font_size < 13)
	{
		font_size = 13;
	}
	
	else if (font_size > 16)
	{
		font_size = 16;
	}
	
	$("html").css("font-size", font_size + "px");
}



function set_footer_margin()
{
	if (.04 * window_width >= 60)
	{
		$(".footer-image-links").css("margin-bottom", "4vw");
	}
	
	else
	{
		$(".footer-image-links").css("margin-bottom", "60px");
	}
}



//Waits for everything to load, then redirects to the chosen page. Any page that calls this should never be able to be accessed again without unloading the page.
function entry_point(url)
{
	var refresh_id = setInterval(function()
	{
		if (supports_webp != null && typeof redirect != "undefined" && typeof fade_in != "undefined" && typeof update_aos != "undefined" && typeof bind_handlers != "undefined" && typeof insert_footer != "undefined" && typeof insert_images != "undefined" && typeof apply_settings != "undefined" && typeof gimp_edge != "undefined" && typeof set_links != "undefined" && typeof remove_hover_on_touch != "undefined" && typeof load_disqus != "undefined")
		{
			clearInterval(refresh_id);
			
			//If it's not an html file, it shouldn't be anywhere near redirect().
			if (url.substring(url.lastIndexOf(".") + 1, url.length) != "html")
			{
				//This should really be using history.replaceState(), but that doesn't update the page to make the file show for some reason.
				window.location.href = url;
			}
			
			else
			{
				redirect(url, false, false, true);
			}
		}
	}, 50);
}



function update_aos()
{
	AOS.disable;
	
	if (url_vars["content_animation"] == 1)
	{
		//This attribute makes the content invisible until it's animated in, so if we're never going to do that, it has to go.
		$("body").find("*[data-aos]").removeAttr("data-aos");
	}
	
	else
	{
		if (page_settings["banner_page"])
		{
			AOS.init({duration: 1200, once: false, offset: window_height/4});
		}
		
		else
		{
			AOS.init({duration: 1200, once: true, offset: window_height/4});
		}
		
		AOS.refreshHard();
	}
}



function on_page_load()
{
	var refresh_id = setInterval(function()
	{
		if (page_settings_done)
		{
			clearInterval(refresh_id);
			
			page_settings_done = false;
			
			
			
			//Start at the top of the page to prevent banner glitches.
			window.scrollTo(0, 0);
			
			//Set the page title.
			$("title").html(page_settings["title"]);
			
			$("html, body").removeClass("no-scroll");
			
			
			
			//Add paragraph indent if necessary.
			if (page_settings["writing_page"])
			{
				$("head").append(`
					<style>
						.body-text
						{
							text-indent: 10pt;
						}
					</style>
				`);
			}
			
			
			
			fade_in();
			
			update_aos();
			
			bind_handlers();
			
			insert_footer();
			
			insert_images();
			
			apply_settings();
			
			set_footer_margin();
			
			gimp_edge();
			
			set_links();
			
			remove_hover_on_touch();
			
			
			
			if (url_vars["comments"] != 1 && page_settings["comments"])
			{
				load_disqus();
			}
		}
	}, 50);
}



function on_page_unload()
{
	//Remove any css and js that's no longer needed to prevent memory leaks.
	$("style:not(.permanent-style)").remove();
	$("head script:not(.permanent-script)").remove();
	
	
	
	//Unbind everything transient from the window (that was bound with jQuery. This is the reason it's currently impossible to remove AOS's handlers).
	$(window).off(".temp-handler");
}



function fade_in()
{
	if (url_vars["content_animation"] == 1)
	{
		$("html").animate({opacity: 1});
		
		if (page_settings["banner_page"])
		{
			load_banner();
		}
	}
	
	else
	{
		if (page_settings["banner_page"])
		{
			load_banner();
		}
		
		else
		{
			$("html").animate({opacity: 1});
		}
	}
}



function bind_handlers()
{
	//Ensure elements always animate 1/4 of the way up the screen, whatever size that screen is.
	$(window).resize(function()
	{
		window_width = $(window).width();
		window_height = $(window).height();
		
		update_aos();
		
		set_font_size();
		set_footer_margin();
	});
}