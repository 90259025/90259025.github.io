//Handles the various settings' effects on the page. Every function adds or removes a style tag that handles all the changes. Some settings, like the theme, require an animation.



function get_url_var(id)
{
	let query = window.location.search.substring(1);
	let vars = query.split("&");
	
	let pair = [];
	
	for (let i = 0; i < vars.length; i++)
	{
		pair = vars[i].split("=");
		
		if (pair[0] == id)
		{
			return pair[1];
		}
	}
	
	return null;
}



let url_vars = 
{
	"theme": get_url_var("theme"),
	"dark_theme_color": get_url_var("dark_theme_color"),
	"contrast": get_url_var("contrast"),
	"text_size": get_url_var("text_size"),
	"font": get_url_var("font"),
	"writing_style": get_url_var("writing_style"),
	"comments": get_url_var("comments"),
	"content_animation": get_url_var("content_animation"),
	"banner_style": get_url_var("banner_style"),
	"content_layout": get_url_var("content_layout")
};

if (window.matchMedia("(prefers-color-scheme: dark)").matches && url_vars["theme"] == null)
{
	url_vars["theme"] = 1;
}



let url_var_functions =
{
	"theme": switch_theme,
	"dark_theme_color": switch_dark_theme_color,
	"contrast": switch_contrast,
	"text_size": switch_text_size,
	"font": switch_font,
	"writing_style": switch_writing_style,
	"comments": switch_comments,
	"content_animation": switch_content_animation,
	"banner_style": switch_banner_style,
	"content_layout": switch_content_layout
};



let settings_texts =
{
	"theme": ["Theme: light", "Theme: dark"],
	"dark_theme_color": ["Dark theme color: dark gray", "Dark theme color: black"],
	"contrast": ["Contrast: normal", "Contrast: high"],
	"text_size": ["Text size: normal", "Text size: large"],
	"font": ["Font: always sans serif", "Font: serif on writing"],
	"writing_style": ["Text on writing pages: double-spaced", "Text on writing pages: single-spaced and indented"],
	"comments": ["Comments: enabled", "Comments: disabled"],
	"content_animation": ["Content animation: enabled", "Content animation: disabled"],
	"banner_style": ["Banners: parallax", "Banners: simple"],
	"content_layout": ["Content layout: automatic (currently {})", "Content layout: always compact"]
};



let dark_theme_background_color = "rgb(24, 24, 24)";

if (url_vars["dark_theme_color"] == 1)
{
	dark_theme_background_color = "rgb(0, 0, 0)";
}



for (key in url_vars)
{
	if (url_vars[key] == null)
	{
		url_vars[key] = 0;
	}
	
	url_vars[key] = !url_vars[key];
	url_var_functions[key]();
}





//Changes the theme and animates elements.
function switch_theme()
{
	try {document.querySelector("#theme-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	//Light to dark
	if (url_vars["theme"] == 0)
	{
		if (url_vars["dark_theme_color"] != 1)
		{
			document.documentElement.style.backgroundColor = "rgb(24, 24, 24)";
		}
		
		else
		{
			document.documentElement.style.backgroundColor = "rgb(0, 0, 0)";
		}
		
		
		
		if (url_vars["contrast"] == 1)
		{
			set_element_styles(".heading-text", "color", "rgb(255, 255, 255)");
			
			set_element_styles(".body-text", "color", "rgb(216, 216, 216)");
			
			set_element_styles(".text-button", "color", "rgb(64, 64, 64)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(127, 127, 127)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#theme-adjust").remove();}
				catch(ex) {}
				
				let element = add_style(get_settings_style("dark_contrast"), false);
				
				element.id = "theme-adjust";
			}, 600);
		}
		
		
		
		else
		{
			set_element_styles(".heading-text", "color", "rgb(255, 255, 255)");
			
			set_element_styles(".body-text", "color", "rgb(152, 152, 152)");
			
			set_element_styles(".text-button", "color", "rgb(127, 127, 127)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(127, 127, 127)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#theme-adjust").remove();}
				catch(ex) {}
				
				let element = add_style(get_settings_style("dark"), false);
				
				element.id = "theme-adjust";
			}, 600);
		}
		
		
		
		try {document.querySelector("#theme-button-row").style.opacity = 0;}
		catch(ex) {}
		
		setTimeout(function()
		{
 			try {document.querySelector("#theme-button-text").textContent = settings_texts["theme"][1];}
 			catch(ex) {}
		}, 300);
		
		url_vars["theme"] = 1;
	}
	
	
	
	//Dark to light
	else
	{
		document.documentElement.style.backgroundColor = "rgb(255, 255, 255)";
		
		
		
		if (url_vars["contrast"] == 1)
		{
			set_element_styles(".heading-text", "color", "rgb(0, 0, 0)");
			
			set_element_styles(".body-text", "color", "rgb(64, 64, 64)");
			
			set_element_styles(".text-button", "color", "rgb(64, 64, 64)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(64, 64, 64)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#theme-adjust").remove();}
				catch(ex) {}
				
				let element = add_style(get_settings_style("contrast"), false);
				
				element.id = "theme-adjust";
			}, 600);
		}
		
		
		
		else
		{
			set_element_styles(".heading-text", "color", "rgb(0, 0, 0)");
			
			set_element_styles(".body-text", "color", "rgb(127, 127, 127)");
			
			set_element_styles(".text-button", "color", "rgb(127, 127, 127)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(127, 127, 127)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#theme-adjust").remove();}
				catch(ex) {}
			}, 600);
		}
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#theme-button-text").textContent = settings_texts["theme"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["theme"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#theme-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_dark_theme_color()
{
	try {document.querySelector("#dark-theme-color-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	if (url_vars["dark_theme_color"] == 0)
	{
		dark_theme_background_color = "rgb(0, 0, 0)";
		
		if (url_vars["theme"] == 1)
		{
			document.documentElement.style.backgroundColor = "rgb(0, 0, 0)";
		}
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#dark-theme-color-button-text").textContent = settings_texts["dark_theme_color"][1];}
			catch(ex) {}
		}, 300);
		
		url_vars["dark_theme_color"] = 1;
	}
	
	
	
	else
	{
		dark_theme_background_color = "rgb(24, 24, 24)";
		
		if (url_vars["theme"] == 1)
		{
			document.documentElement.style.backgroundColor = "rgb(24, 24, 24)";
		}
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#dark-theme-color-button-text").textContent = settings_texts["dark_theme_color"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["dark_theme_color"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#dark-theme-color-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_contrast()
{
	try {document.querySelector("#contrast-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	//Default to high
	if (url_vars["contrast"] == 0)
	{
		if (url_vars["theme"] == 1)
		{
			set_element_styles(".heading-text", "color", "rgb(255, 255, 255)");
			
			set_element_styles(".body-text", "color", "rgb(216, 216, 216)");
			
			set_element_styles(".text-button", "color", "rgb(64, 64, 64)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(127, 127, 127)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#contrast-adjust").remove();}
				catch(ex) {}
				
				let element = add_style(get_settings_style("dark_contrast"), false);
				
				element.id = "contrast-adjust";
			}, 600);
		}
		
		
		
		else
		{
			set_element_styles(".heading-text", "color", "rgb(0, 0, 0)");
			
			set_element_styles(".body-text", "color", "rgb(64, 64, 64)");
			
			set_element_styles(".text-button", "color", "rgb(64, 64, 64)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(64, 64, 64)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#contrast-adjust").remove();}
				catch(ex) {}
				
				let element = add_style(get_settings_style("contrast"), false);
				
				element.id = "contrast-adjust";
			}, 600);
		}
		
		
		setTimeout(function()
		{
			try {document.querySelector("#contrast-button-text").textContent = settings_texts["contrast"][1];}
			catch(ex) {}
		}, 300);
		
		url_vars["contrast"] = 1;
	}
	
	
	
	//High to default
	else
	{
		if (url_vars["theme"] == 1)
		{
			set_element_styles(".heading-text", "color", "rgb(255, 255, 255)");
			
			set_element_styles(".body-text", "color", "rgb(152, 152, 152)");
			
			set_element_styles(".text-button", "color", "rgb(127, 127, 127)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(127, 127, 127)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#contrast-adjust").remove();}
				catch(ex) {}
				
				let element = add_style(get_settings_style("dark"), false);
				
				element.id = "contrast-adjust";
			}, 600);
		}
		
		
		
		else
		{
			set_element_styles(".heading-text", "color", "rgb(0, 0, 0)");
			
			set_element_styles(".body-text", "color", "rgb(127, 127, 127)");
			
			set_element_styles(".text-button", "color", "rgb(127, 127, 127)");
			
			set_element_styles(".footer-button, .text-button", "border-color", "rgb(127, 127, 127)");
			
			
			
			setTimeout(function()
			{
				try {document.querySelector("#contrast-adjust").remove();}
				catch(ex) {}
			}, 600);
		}
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#contrast-button-text").textContent = settings_texts["contrast"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["contrast"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#contrast-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_text_size()
{
	document.body.classList.add("animated-opacity");
	document.body.style.opacity = 0;
	
	
	
	//Normal to large
	if (url_vars["text_size"] == 0)
	{
		setTimeout(function()
		{
			try {document.querySelector("#text-size-adjust").remove();}
			catch(ex) {}
			
			let element = add_style(`
				html
				{
					font-size: 18px;
				}
				
				@media screen and (min-width: 1000px)
				{
					html
					{
						font-size: 22px;
					}
				}
			`, false);
			
			element.id = "text-size-adjust";
			
			
			
			try {document.querySelector("#text-size-button-text").textContent = settings_texts["text_size"][1];}
			catch(ex) {}
		}, 300);
			
		url_vars["text_size"] = 1;
	}
		
	else
	{
		setTimeout(function()
		{
			try {document.querySelector("#text-size-adjust").remove();}
			catch(ex) {}
			
			
			
			try {document.querySelector("#text-size-button-text").textContent = settings_texts["text_size"][0];}
			catch(ex) {}
		}, 300);
			
		url_vars["text_size"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		document.body.style.opacity = 1;
			
		setTimeout(function()
		{
			document.body.classList.remove("animated-opacity");
		}, 300);
	}, 300);
	
	write_url_vars();
}





function switch_font()
{
	try {document.querySelector("#font-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	//Sans to serif
	if (url_vars["font"] == 0)
	{
		setTimeout(function()
		{
			try {document.querySelector("#font-button-text").textContent = settings_texts["font"][1];}
			catch(ex) {}
		}, 300);
		
		url_vars["font"] = 1;
	}
	
	
	
	//Serif to sans
	else
	{
		setTimeout(function()
		{
			try {document.querySelector("#font-button-text").textContent = settings_texts["font"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["font"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#font-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_writing_style()
{
	try {document.querySelector("#writing-style-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	//Double-spaced to indented
	if (url_vars["writing_style"] == 0)
	{
		setTimeout(function()
		{
			try {document.querySelector("#writing-style-button-text").textContent = settings_texts["writing_style"][1]}
			catch(ex) {}
		}, 300);
		
		url_vars["writing_style"] = 1;
	}
	
	
	
	//Indented to double-spaced
	else
	{
		setTimeout(function()
		{
			try {document.querySelector("#writing-style-button-text").textContent = settings_texts["writing_style"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["writing_style"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#writing-style-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_comments()
{
	try {document.querySelector("#comments-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	if (url_vars["comments"] == 0)
	{
		setTimeout(function()
		{
			try {document.querySelector("#comments-button-text").textContent = settings_texts["comments"][1];}
			catch(ex) {}
		}, 300);
		
		url_vars["comments"] = 1;
	}
	
	
	
	else
	{
		setTimeout(function()
		{
			try {document.querySelector("#comments-button-text").textContent = settings_texts["comments"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["comments"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#comments-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_content_animation()
{
	try {document.querySelector("#content-animation-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	if (url_vars["content_animation"] == 0)
	{
		document.documentElement.classList.remove("animated-opacity");
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#content-animation-button-text").textContent = settings_texts["content_animation"][1];}
			catch(ex) {}
		}, 300);
		
		url_vars["content_animation"] = 1;
	}
	
	
	
	else
	{
		document.documentElement.classList.add("animated-opacity");
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#content-animation-button-text").textContent = settings_texts["content_animation"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["content_animation"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#content-animation-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_banner_style()
{
	try {document.querySelector("#banner-style-button-row").style.opacity = 0;}
	catch(ex) {}
	
	
	
	if (url_vars["banner_style"] == 0)
	{
		try {document.querySelector("#banner-adjust").remove();}
		catch(ex) {}
		
		let element = add_style(`
			.banner:before
			{
				position: absolute !important;
			}
		`, false);
		
		element.id = "banner-adjust";
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#banner-style-button-text").textContent = settings_texts["banner_style"][1];}
			catch(ex) {}
		}, 300);
		
		url_vars["banner_style"] = 1;
	}
	
	else
	{
		try {document.querySelector("#banner-adjust").remove();}
		catch(ex) {}
		
		
		
		setTimeout(function()
		{
			try {document.querySelector("#banner-style-button-text").textContent = settings_texts["banner_style"][0];}
			catch(ex) {}
		}, 300);
		
		url_vars["banner_style"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		try {document.querySelector("#banner-style-button-row").style.opacity = 1;}
		catch(ex) {}
	}, 300);
	
	write_url_vars();
}





function switch_content_layout()
{
	if (layout_string == "small-screen")
	{
		//Yes, we really should be using html here, not body, but html has css on it on the settings page that gets in the way of that, and this is just way way easier.
		document.body.classList.add("animated-opacity");
		document.body.style.opacity = 0;
	}
	
	else
	{
		try {document.querySelector("#content-layout-button-row").style.opacity = 0;}
		catch(ex) {}
	}
	
	
	
	if (url_vars["content_layout"] == 0)
	{
		setTimeout(function()
		{
			let elements = document.querySelectorAll("*");
			for (let i = 0; i < elements.length; i++)
			{
				elements[i].classList.add("layout-override");
			}
			
			
			
			try {document.querySelector("#content-layout-button-text").textContent = settings_texts["content_layout"][1];}
			catch(ex) {}
		}, 300);
		
		url_vars["content_layout"] = 1;
	}
	
	
	
	else
	{
		setTimeout(function()
		{
			let elements = document.querySelectorAll("*");
			for (let i = 0; i < elements.length; i++)
			{
				elements[i].classList.remove("layout-override");
			}
			
			
			
			try {document.querySelector("#content-layout-button-text").textContent = settings_texts["content_layout"][0].replace("{}", layout_string);}
			catch(ex) {}
		}, 300);
		
		url_vars["content_layout"] = 0;
	}
	
	
	
	setTimeout(function()
	{
		if (layout_string == "small-screen")
		{
			document.body.style.opacity = 1;
			
			setTimeout(function()
			{
				document.body.classList.remove("animated-opacity");
			}, 300);
		}
		
		else
		{
			try {document.querySelector("#content-layout-button-row").style.opacity = 1;}
			catch(ex) {}
		}
	}, 300);
	
	write_url_vars();
}





function get_settings_style(settings) 
{
	if (settings == "dark")
	{
		return `
			.heading-text, .date-text, .title-text
			{
				color: rgb(255, 255, 255);
			}
			
			.section-text
			{
				color: rgb(184, 184, 184);
			}
			
			.body-text, .song-lyrics, .image-link-subtext
			{
				color: rgb(152, 152, 152);
			}
			
			.body-text .link
			{
				color: rgb(152, 216, 152);
			}
			
			
			
			.quote-text
			{
				color: rgb(104, 104, 104);
			}
			
			.quote-attribution
			{
				color: rgb(188, 188, 188);
			}
			
			
			
			.line-break
			{
				background: ${dark_theme_background_color};
				background: -moz-linear-gradient(left, ${dark_theme_background_color} 0%, rgb(116,116,116) 50%, ${dark_theme_background_color} 100%);
				background: -webkit-linear-gradient(left, ${dark_theme_background_color} 0%,rgb(116,116,116) 50%,${dark_theme_background_color}) 100%);
				background: linear-gradient(to right, ${dark_theme_background_color} 0%,rgb(116,116,116) 50%,${dark_theme_background_color} 100%);
			}
			
			.text-box
			{
				background-color: ${dark_theme_background_color};
				color: rgb(152, 152, 152);
				border-color: rgb(88, 88, 88);
			}
			
			.text-box:focus
			{
				border-color: rgb(152, 152, 152);
				color: rgb(216, 216, 216);
			}
			
			
			
			.footer-button, .text-button, .nav-button
			{
				border-color: rgb(127, 127, 127);
			}
		`;
	}
	
	
	
	else if (settings == "contrast")
	{
		return `
			.heading-text, .date-text, .title-text
			{
				color: rgb(0, 0, 0);
			}
			
			.section-text
			{
				color: rgb(48, 48, 48);
			}
			
			.body-text, .song-lyrics, .image-link-subtext, .text-button
			{
				color: rgb(64, 64, 64);
			}
			
			.body-text .link
			{
				color: rgb(64, 128, 64);
			}
			
			
			
			.quote-text
			{
				color: rgb(88, 88, 88);
			}
			
			.quote-attribution
			{
				color: rgb(46, 46, 46);
			}
			
			
			
			.line-break
			{
				background: rgb(255, 255, 255);
				background: -moz-linear-gradient(left, rgb(255, 255, 255) 0%, rgb(120,120,120) 50%, rgb(255, 255, 255) 100%);
				background: -webkit-linear-gradient(left, rgb(255, 255, 255) 0%,rgb(120,120,120) 50%,rgb(255, 255, 255)) 100%);
				background: linear-gradient(to right, rgb(255, 255, 255) 0%,rgb(120,120,120) 50%,rgb(255, 255, 255) 100%);
			}
			
			.text-box
			{
				background-color: rgb(255, 255, 255);
				color: rgb(152, 152, 152);
				border-color: rgb(88, 88, 88);
			}
			
			.text-box:focus
			{
				border-color: rgb(152, 152, 152);
				color: rgb(216, 216, 216);
			}
			
			
			
			.footer-button, .text-button, .nav-button
			{
				border-color: rgb(64, 64, 64);
			}
		`;
	}
	
	
	
	else if (settings == "dark_contrast")
	{
		return `
			.heading-text, .date-text, .title-text
			{
				color: rgb(255, 255, 255);
			}
			
			.section-text
			{
				color: rgb(232, 232, 232);
			}
			
			.body-text, .song-lyrics, .image-link-subtext
			{
				color: rgb(216, 216, 216);
			}
			
			.body-text .link
			{
				color: rgb(216, 255, 216);
			}
			
			
			
			.quote-text
			{
				color: rgb(192, 192, 192);
			}
			
			.quote-attribution
			{
				color: rgb(234, 234, 234);
			}
			
			
			
			.line-break
			{
				background: ${dark_theme_background_color};
				background: -moz-linear-gradient(left, ${dark_theme_background_color} 0%, rgb(164,164,164) 50%, ${dark_theme_background_color} 100%);
				background: -webkit-linear-gradient(left, ${dark_theme_background_color} 0%,rgb(164,164,164) 50%,${dark_theme_background_color}) 100%);
				background: linear-gradient(to right, ${dark_theme_background_color} 0%,rgb(164,164,164) 50%,${dark_theme_background_color} 100%);
			}
			
			.text-box
			{
				background-color: ${dark_theme_background_color};
				color: rgb(216, 216, 216);
				border-color: rgb(152, 152, 152);
			}
			
			.text-box:focus
			{
				border-color: rgb(216, 216, 216);
				color: rgb(255, 255, 255);
			}
					
			
			
			.footer-button, .text-button, .nav-button
			{
				border-color: rgb(127, 127, 127);
			}
		`;
	}
};



function set_img_button_contrast()
{
	let elements = document.querySelectorAll(".nav-button, .scroll-button");
	
	for (i = 0; i < elements.length; i++)
	{
		elements[i].setAttribute("src", elements[i].getAttribute("src").replace("chevron-left", "chevron-left-dark").replace("chevron-right", "chevron-right-dark").replace("chevron-down", "chevron-down-dark"));
	}
}



function set_writing_page_font()
{
	set_element_styles(".body-text", "font-family", "'Gentium Book Basic', serif");
}



function set_writing_page_style()
{
	//This is a fancy way of saying ("section br").remove(), but it ensures that <br> tags in places like song lyrics won't get removed.
	let elements = document.querySelectorAll("section div .body-text");
	
	for (let i = 0; i < elements.length; i++)
	{
		//The next element might not exist, so we have to be careful.
		try
		{
			let next_element = elements[i].parentNode.nextElementSibling;
			
			if (next_element.tagName.toLowerCase() == "br")
			{
				next_element.remove();
			}
		}
		
		catch(ex) {}
	}
	
	
	//Add an indent on every element except the first in the section.
	elements = document.querySelectorAll("section div:not(:first-child) .body-text");
	for (let i = 0; i < elements.length; i++)
	{
		elements[i].style.textIndent = "10pt";
	}
}



function remove_disqus()
{
	try
	{
		document.querySelector("#disqus_thread").previousElementSibling.remove();
		document.querySelector("#disqus_thread").previousElementSibling.remove();
		document.querySelector("#disqus_thread").previousElementSibling.remove();
		document.querySelector("#disqus_thread").remove();
	}
	
	catch(ex) {}
}



function remove_animation()
{
	let elements = document.body.querySelectorAll("[data-aos]")
	
	for (let i = 0; i < elements.length; i++)
	{
		elements[i].removeAttribute("data-aos");
	}
}



function override_layout()
{
	let elements = document.querySelectorAll("*");
	
	for (let i = 0; i < elements.length; i++)
	{
		elements[i].classList.add("layout-override");
	}
}