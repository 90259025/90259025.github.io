//Included on every page. Sets up variables and runs browsers.js, footer.js, navigation.js, and settings.js.


var window_width, window_height;

//Used by dark-theme.js to only affect links once the footer is there.
var footer_loaded = 0;

//Used by weird pages like Corona if they want to work dark theme out on their own.
var manual_dark_theme = 0;

//Whether the browser supports WebP images or not. Given a boolean value when decided.
var supports_webp = null;



$(function()
{	
	//Start at the top of the page to prevent banner glitches. I don't understand why, but this is the only working method I've found to reset scroll on load.
	$([document.documentElement, document.body]).animate({scrollTop: 0});
	
	
	
	window_width = $(window).width();
	window_height = $(window).height();
	
	
	
	if (url_vars["content_animation"] == 1)
	{
		//This attribute makes the content invisible until it's animated in, so if we're never going to do that, it has to go.
		$("body").find("*[data-aos]").removeAttr("data-aos");
	}
	
	else
	{
		AOS.init({duration: 1200, once: true, offset: window_height/4});
	}
	
	
	
	//Fade in the opacity when the user presses the back button.
	window.addEventListener("pageshow", function(event)
	{
		var historyTraversal = event.persisted || 
			(typeof window.performance != "undefined" && 
			window.performance.navigation.type === 2);
		
		if (historyTraversal)
		{
			if (url_vars["link_animation"] == 1)
			{
				$("html").css("opacity", 1);
			}
			
			else
			{
				setTimeout(function()
				{
					$("html").animate({opacity: 1}, 300, "swing");
				}, 300);
			}
		}
	});
	
	
	
	//Ensure elements always animate 1/4 of the way up the screen, whatever size that screen is.
	$(window).resize(function()
	{
		window_width = $(window).width();
		window_height = $(window).height();
		
		if (url_vars["content_animation"] != 1)
		{
			AOS.init({offset: window_height/4});
		}
	});
	
	
	
	$.getScript("/scripts/browsers.js");
	
	$.getScript("/scripts/images.js");
	
	$.getScript("/scripts/navigation.js", function()
	{
		$.getScript("/scripts/settings-body.js");
	});
	
	$.getScript("/scripts/footer.js");
});