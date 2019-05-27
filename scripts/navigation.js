//Handles redirects and url variables.



//Handles virtually all links.
function redirect(url, to_external_site, from_nonstandard_color)
{
	//Indicates whether we need to pause to change the background color. Example: the bottom of the Corona page.
	from_nonstandard_color = (typeof from_nonstandard_color != "undefined") ? from_nonstandard_color : 0;
	
	to_external_site = (typeof to_external_site != "undefined") ? to_external_site : 0;
	
	
	
	//If we're going somewhere outside of the site, open it in a new tab and don't screw with the opacity.
	if (to_external_site == 1)
	{
		window.open(url, "_blank");
		return;
	}
	
	
	
	var include_return_url = 0;
	
	if (url == "/settings.html")
	{
		include_return_url = 1;
	}
	
	
	
	//Act like a normal link, with no transitions, if the user wants that.
	if (url_vars["link_animation"] == 1)
	{
		window.location.href = url + concat_url_vars(include_return_url);
	}
	
	else
	{
		//Fade out the current page's content
		$("html").animate({opacity: 0}, 300, "swing");
		
		//If necessary, take the time to fade back to the default background color, whatever that is.
		if (from_nonstandard_color == 1)
		{
			setTimeout(function()
			{
				$("html, body").addClass("background-transition");
				
				if (url_vars["theme"] == 1)
				{
					$("html, body").css("background-color", "rgb(24, 24, 24)");
				}
				
				else
				{
					$("html, body").css("background-color", "rgb(255, 255, 255)");
				}
				
				setTimeout(function()
				{
					window.location.href = url + concat_url_vars(include_return_url);
				}, 450);
			}, 300);
		}
		
		//Finally, redirect to the new page.
		else
		{
			setTimeout(function()
			{
				window.location.href = url + concat_url_vars(include_return_url);
			}, 300);
		}
	}
}



//Returns a string of url vars that can be attached to any url.
function concat_url_vars(include_return_url)
{
	var first_var_written = 0;
	var string = "";
	var key;
	var temp = "";
	
	for (var i = 0; i < Object.keys(url_vars).length; i++)
	{
		key = Object.keys(url_vars)[i];
		
		//It's necessary to write theme=0 for the following reason: if a user with a system-wide dark theme enters and attempts to change to the light theme, and this function doesn't write theme=0, the next page loaded will see url_vars["theme"] = null, assume there's no preference, and use the system setting again.
		if ((key != "theme" && url_vars[key] != 0) || (key == "theme"))
		{
			if (first_var_written == 0)
			{
				string += "?" + key + "=" + url_vars[key];
				first_var_written = 1;
			}
			
			else
			{
				string += "&" + key + "=" + url_vars[key];
			}
		}
	}
	
	
	
	//If we're going to the settings page, we need to know where we came from so we can return there later. Just don't include any current url variables.
	if (include_return_url == 1)
	{
		if (first_var_written == 0)
		{
			string += "?return=" + encodeURIComponent(window.location.href.split("?", 1));
			first_var_written = 1;
		}
		
		else
		{
			string += "&return=" + encodeURIComponent(window.location.href.split("?", 1));
		}
	}
	
	
	
	return string;
}

function write_url_vars()
{
	//Make state persist on refresh, unless it's the settings page, which will just clog up the history.
	if (!(window.location.href.includes("settings")))
	{
		history.replaceState({}, document.title, window.location.href.split("?", 1) + concat_url_vars(0));
	}
}