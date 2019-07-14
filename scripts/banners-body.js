var scroll = 0;
var banner_done = false;
var scroll_button_done = false;
var global_opacity = 0;

var banner_extension = "";



$(function()
{
	if (url_vars["content_animation"] != 1)
	{
		AOS.init({duration: 1200, once: false, offset: window_height/4});
	}
	
	
	
	if (supports_webp)
	{
		banner_extension = "webp";
	}
	
	else
	{
		banner_extension = "jpg";
	}
	
	
	
	//Only do banner things if the banner things are in the standard places.
	if (manual_banner != true)
	{
		$("head").append(`
			<style>
				.banner:before
				{
					background: url("banners/landscape.${banner_extension}") no-repeat center center;
					-webkit-background-size: cover;
					background-size: cover;
				}
				
				@media screen and (max-aspect-ratio: 10/16), (max-width: 800px)
				{
					.banner:before
					{
						background: url("banners/portrait.${banner_extension}") no-repeat center center;
						-webkit-background-size: cover;
						background-size: cover;
					}
				}
			</style>
		`);
		
		
		
		var banner_name;
		
		if ($(window).width() / $(window).height() < 10/16 || $(window).width() <= 800)
		{
			banner_name = "portrait." + banner_extension;
		}
		
		else
		{
			banner_name = "landscape." + banner_extension;
		}
		
		
		
		//Fade in once the banner has loaded.
		if (url_vars["content_animation"] == 1)
		{
			$("body").css("opacity", 1);
		}
		
		else
		{
			$("<img/>").attr("src", "banners/" + banner_name).on("load", function()
			{
				$(this).remove();
				$("body").animate({opacity: 1}, 300, "swing");
				
				//If the user just sits for three seconds after the banner has loaded, give them a hint in the form of a scroll button.
				if (scroll == 0)
				{
					setTimeout(add_scroll_button, 3000);
				}
			});
		}
	}
	
	
	
	$(window).scroll(function()
	{
		scroll_update();
	});
	
	
	
	$(window).resize(function()
	{
		scroll_update();
	});
});



function scroll_update()
{
	scroll = $(window).scrollTop();
	
	if (scroll >= 0)
	{
		if (url_vars["banner_style"] != 1)
		{
			if (scroll <= window_height)
			{
				global_opacity = .5 + .5 * Math.sin(Math.PI * Math.max(1 - scroll / window_height, 0) - .5 * Math.PI);
				$("#background-image").css("opacity", global_opacity);
				
				if (global_opacity == 0)
				{
					banner_done = true;
				}
				
				else
				{
					banner_done = false;
				}
			}
			
			else if (banner_done == false)
			{
				$("#background-image").css("opacity", 0);
				banner_done = true;
			}
		}
		
		
		
		if (scroll <= window_height/3)
		{
			global_opacity = .5 + .5 * Math.sin(Math.PI * Math.max(1 - 3 * scroll / window_height, 0) - .5 * Math.PI);
			
			$(".scroll-button").css("opacity", global_opacity);
			
			if (global_opacity == 0)
			{
				$(".scroll-button").remove();
				scroll_button_done = true;
			}
			
			else
			{
				scroll_button_done = false;
			}
		}
		
		else if (scroll_button_done == false)
		{
			if (url_vars["banner_style"] != 1)
			{
				$(".name-text").css("opacity", 0);
			}
			
			$(".scroll-button").remove();
			
			scroll_button_done = true;
		}
	}
}



function add_scroll_button()
{
	//Only add the scroll button if the user is still on the top of the page.
	if (scroll == 0)
	{
		var chevron_name = "chevron-down";
		
		if (url_vars["contrast"] == 1)
		{
			chevron_name += "-dark";
		}
		
		$("#banner-cover").before(`
			<div style="height: 100vh; display: flex; align-items: center; justify-content: center" data-aos="fade-down">
				<input type="image" class="scroll-button" src="/graphics/general-icons/` + chevron_name + `.png" alt="Scroll down" onclick="scroll_down()">
			</div>
		`);
		
		$("#banner-cover").remove();
	}
}



//Triggered by pressing the scroll button.
function scroll_down()
{
	$("html, body").animate({scrollTop: $("#scroll-to").offset().top}, 1200, "swing");
}