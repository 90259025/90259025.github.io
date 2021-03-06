/*
	
	Page: methods for managing the current page.
		
		load: run after the HTML is prepared to organize everything necessary.
		
		...
		
		
		Load: methods for preparing a page to be displayed.
			
			parse_script_tags: runs the script tags in the html -- typically, these set the page settings and invoke Page.load.
			
			parse_custom_style: loads the css in the style folder, if it exists.
			
			parse_custom_scripts: runs the scripts in the scripts folder, if it exists.
			
			fade_in: animates in the opacity.
			
			
			
			TitleText: methods for displaying animated text with vara.js.
				
				prepare: gets the necessary machinery set up.
				
				show: animates some text in.
				
			
			
			AOS: methods for handling content animation.
				
				load: initializes all of the anchors and elements.
				
				show_section: manually reveals a section.
				
				hide_section: manually hides a section.
			
			
			
			HoverEvents: methods for setting up the hover events that the site uses.
				
				set_up: adds all the event listeners necessary.
				
				add: manually adds a hover event.
				
				remove: removes all hover events.
			
			
			
			FocusEvents: methods for handling focus events that aren't dealt with automatically.
				
				set_up_weird_elements: initializes elements who need focus passed to their children.
			
			
			
			TextButtons: methods for manipulating text buttons.
				
				set_up: resizes text buttons whenever the window is resized.
				
				equalize: makes all linked text buttons have the same width and height for a more symmetric appearance.
			
			
			
			Links: methods for handling links on the page.
				
				set: turns all links' urls into single page app urls with a page variable and adds on the url variables.
				
				disable: makes all links do nothing when pressed, allowing the redirect function to take effect.
			
			
			
			Math: methods for handling MathJax on the page.
				
				typeset: compiles MathJax into Latex.
	
*/



"use strict";



Page.load = async function()
{
	this.Navigation.currently_changing_page = false;
	
	
	
	this.Load.parse_custom_style();
	this.Load.parse_custom_scripts();
	
	
	
	//Set the page title.
	document.querySelector("title").innerHTML = this.settings["title"];
	
	
	
	if ("title_page_text" in this.settings && this.settings["title_page_text"] !== "")
	{
		await this.Load.TitleText.prepare();
	}
	
	
	
	if (!("no_footer" in this.settings && this.settings["no_footer"]))
	{
		this.Footer.load();
		
		setTimeout(() =>
		{
			this.Footer.Floating.on_scroll();
		}, 50);
	}
	
	
	
	this.Load.AOS.load();
	
	setTimeout(() =>
	{
		this.Load.AOS.on_resize();
	}, 1000);
	
	
	
	Page.Layout.Multicols.active = false;
	
	Page.Layout.on_resize();
	
	if (this.Layout.layout_string === "ultrawide")
	{
		this.Layout.Multicols.create();
	}
	
	
	
	if (!("no_footer" in this.settings && this.settings["no_footer"]))
	{
		setTimeout(() =>
		{
			this.Load.AOS.fix_footer_anchor();
		}, 500);
	}
	
	
	
	this.Load.fade_in();
	
	
	
	Page.Images.insert().then(() =>
	{
		this.Load.AOS.on_resize();
	});
	
	Page.Banner.fetch_other_page_banners_in_background();
	
	this.Load.Links.set();
	
	this.Load.Links.disable();
	
	this.Load.HoverEvents.set_up();
	
	this.Load.TextButtons.set_up();
	
	setTimeout(() =>
	{
		this.Load.FocusEvents.set_up_weird_elements();
	}, 50);
	
	
	
	Page.background_color_changed = false;
	
	
	
	if ("banner_page" in this.settings && this.settings["banner_page"])
	{
		this.Banner.fetch_other_size_in_background();
	}
	
	if (Site.Settings.url_vars["contrast"] === 1)
	{
		Site.Settings.set_img_button_contrast();
	}
	
	if ("writing_page" in this.settings && this.settings["writing_page"] && Site.Settings.url_vars["font"] === 1)
	{
		Site.Settings.set_writing_page_font();
	}
	
	if (this.Layout.layout_string === "ultrawide" && "small_margins_on_ultrawide" in this.settings && this.settings["small_margins_on_ultrawide"])
	{
		Site.Settings.reduce_page_margins();
	}
	
	if (Site.Settings.url_vars["content_animation"] === 1)
	{
		Site.Settings.remove_animation();
	}
	
	if ("math_page" in this.settings && this.settings["math_page"])
	{
		this.Load.Math.typeset();
	}
};



Page.Load =
{
	//Right, so this is a pain. One of those things jQuery makes really easy and that you might never notice otherwise is that when using $(element).html(data), any non-external script tags in data are automatically excuted. This is great, but it doesn't happen when using element.innerHTML. Weirdly enough, though, it works with element.appendChild. Therefore, we just need to get all our script tags, and for each one, make a new tag with identical contents, append it to the body, and delete the original script.
	parse_script_tags: function()
	{
		var scripts = document.querySelectorAll("script");
		
		for (let i = 0; i < scripts.length; i++)
		{
			let new_script = document.createElement("script");
			
			new_script.innerHTML = scripts[i].textContent;
			
			document.body.appendChild(new_script);
			
			scripts[i].remove();
		}
	},



	//Finds styles in a folder called "style" inside the page's folder. It first tries to find a minified file, and if it can't, it then tries to find a non-minified one so that testing can still work. The style files must have the same name as the html file.
	parse_custom_style: function()
	{
		let page_name = Page.url.split("/");
		page_name = page_name[page_name.length - 1];
		page_name = page_name.split(".");
		page_name = page_name[0];
		
		
		
		try
		{
			//Make sure there's actually something to get.
			fetch(Page.parent_folder + "style/" + page_name + ".css")
			
			.then((response) =>
			{
				let element = document.createElement("link");
				
				element.setAttribute("rel", "stylesheet");
				
				
				
				if (DEBUG)
				{
					element.setAttribute("href", Page.parent_folder + "style/" + page_name + ".css");
				}
				
				else
				{
					element.setAttribute("href", Page.parent_folder + "style/" + page_name + ".min.css");
				}
				
				
				
				//This is kind of subtle. If we append this new style to the end of the head, then it will take precendence over settings styles, which is terrible -- for example, the homepage will render all of its custom classes like quote-text and quote-attribution incorrectly. Therefore, we need to *prepend* it, ensuring it has the lowest-possible priority.
				element.classList.add("temporary-style");
				
				document.head.insertBefore(element, document.head.firstChild);
			});
		}
		
		catch(ex) {}
	},



	parse_custom_scripts: function()
	{
		let page_name = Page.url.split("/");
		page_name = page_name[page_name.length - 1];
		page_name = page_name.split(".");
		page_name = page_name[0];
		
		
		
		try
		{
			//Make sure there's actually something to get.
			fetch(Page.parent_folder + "scripts/" + page_name + ".js")
			
			.then((response) =>
			{
				let element = document.createElement("script");
				
				
				
				if (DEBUG)
				{
					element.setAttribute("src", Page.parent_folder + "scripts/" + page_name + ".js");
				}
				
				else
				{
					element.setAttribute("src", Page.parent_folder + "scripts/" + page_name + ".min.js");
				}
				
				
				
				element.classList.add("temporary-script");
				
				document.body.appendChild(element);
			});
		}
		
		catch(ex) {}
	},



	fade_in: function()
	{
		if ("banner_page" in Page.settings && Page.settings["banner_page"])
		{
			Site.add_style(`
				#banner
				{
					background: url(${Page.Banner.file_path}landscape.${Page.Images.file_extension}) no-repeat center center;
					background-size: cover;
				}
				
				@media (max-aspect-ratio: 1/1)
				{
					#banner
					{
						background: url(${Page.Banner.file_path}portrait.${Page.Images.file_extension}) no-repeat center center;
						background-size: cover;
					}
				}
			`);
			
			document.body.style.opacity = 1;
		}
		
		else
		{
			document.body.classList.remove("animated-opacity");
			document.body.style.opacity = 1;
			document.body.classList.add("animated-opacity");
		}
	},
	
	
	
	TitleText:
	{
		canceled: false,

		cancel_message_shown: false,
		
		page_ids:
		{
			"/teaching/uo/111/111.html": 0,
			"/teaching/uo/112/112.html": 1,
			"/teaching/uo/105/105.html": 2,
			"/teaching/uo/252/252.html": 3
		},
		
		
		
		prepare: async function()
		{
			if (Site.Settings.url_vars["content_animation"] === 1 || ((Site.Settings.url_vars["title_pages_seen"] >> this.page_ids[Page.url]) & 1))
			{
				document.querySelector("#vara-container").remove();
				
				document.querySelector("#cancel-vara-text").remove();
			}
			
			else
			{
				document.body.classList.remove("animated-opacity");
				document.body.style.opacity = 1;
				document.body.classList.add("animated-opacity");
				
				
				
				await Promise.any([this.show(Page.settings["title_page_text"]), this.listen_for_click()]);
				
				
				
				document.documentElement.removeEventListener("mousemove", this.show_cancel_message_no_touch);
				document.documentElement.removeEventListener("touchmove", this.show_cancel_message_touch);
				
				
				
				if (!((Site.Settings.url_vars["title_pages_seen"] >> this.page_ids[Page.url]) & 1))
				{
					Site.Settings.url_vars["title_pages_seen"] += (1 << this.page_ids[Page.url]);
					
					Page.Navigation.write_url_vars();
				}
			}
		},
		
		

		show: function(text_to_draw)
		{
			return new Promise((resolve, reject) =>
			{
				this.canceled = false;
				
				
				
				document.documentElement.style.overflowY = "hidden";
				document.body.style.overflowY = "hidden";
				
				document.body.style.userSelect = "none";
				document.body.style.WebkitUserSelect = "none";
				
				document.querySelector("#vara-container").addEventListener("touchmove", (e) =>
				{
					e.preventDefault();
				});
				
				
				
				setTimeout(() =>
				{
					let color = "black";
					
					if (Site.Settings.url_vars["theme"] === 1)
					{
						color = "white";
					}
					
					let text = new Vara("#vara-container", Page.parent_folder + "/vara-font.json", [{text: text_to_draw, fontSize: Page.settings["title_page_text_size"] * Page.Layout.window_width / text_to_draw.length, duration: 4000, strokeWidth: .5, textAlign: "center", color: color}]);
					
					text.animationEnd((id, object) =>
					{
						if (this.canceled)
						{
							return;
						}
						
						
						
						setTimeout(() =>
						{
							if (this.canceled)
							{
								return;
							}
							
							
							
							document.body.style.opacity = 0;
							
							setTimeout(() =>
							{
								if (this.canceled)
								{
									return;
								}
								
								
								
								document.querySelector("#vara-container").remove();
								
								document.querySelector("#cancel-vara-text").remove();
								
								
								
								document.documentElement.style.overflowY = "visible";
								document.body.style.overflowY = "visible";
								
								document.body.style.userSelect = "auto";
								document.body.style.WebkitUserSelect = "auto";
								
								resolve();
							}, 300);
						}, 500);
					});
				}, 300);
			});
		},



		listen_for_click: function()
		{
			return new Promise((resolve, reject) =>
			{
				document.querySelector("#vara-container").addEventListener("click", () =>
				{
					this.canceled = true;
				
					document.body.style.opacity = 0;
					
					setTimeout(() =>
					{
						document.querySelector("#vara-container").remove();
						
						document.querySelector("#cancel-vara-text").remove();
						
						
						
						document.documentElement.style.overflowY = "visible";
						document.body.style.overflowY = "visible";
						
						document.body.style.userSelect = "auto";
						document.body.style.WebkitUserSelect = "auto";
						
						
						
						resolve();
					}, 300);
				});
				
				
				
				setTimeout(() =>
				{
					this.cancel_message_shown = false;
					
					document.documentElement.addEventListener("mousemove", this.show_cancel_message_no_touch);
					document.documentElement.addEventListener("touchmove", this.show_cancel_message_touch);
				}, 1000);
			});
		},



		show_cancel_message_no_touch: function()
		{
			if (this.cancel_message_shown)
			{
				return;
			}
			
			this.cancel_message_shown = true;
			
			
			
			try
			{
				document.querySelector("#cancel-vara-text").textContent = "Click animation to skip";
				
				document.querySelector("#cancel-vara-text").style.opacity = 1;
			}
			
			catch(ex) {}
		},



		show_cancel_message_touch: function()
		{
			if (this.cancel_message_shown)
			{
				return;
			}
			
			this.cancel_message_shown = true;
			
			
			
			document.querySelector("#cancel-vara-text").textContent = "Tap animation to skip";
			
			document.querySelector("#cancel-vara-text").style.opacity = 1;
		}
	},
	
	
	
	AOS:
	{
		//A list of lists. Each sublist starts with an anchor, then lists all the elements anchored to it in sequence, along with their delays.
		elements: [],

		anchor_positions: [],

		anchor_offsets: [],

		anchors_shown: [],

		currently_animating: [],
		
		
		
		//So, there's this bug that's plagued the site since its inception. iOS Safari eventually seems to have a memory leak and starts cutting off all transitions before they've reached their end. It gets progressively worse until quitting the app is required. It can be triggered by drag-and-dropping elements repeatedly *anywhere* in Safari, and affects all webpages with CSS transitions.

		//In iOS 13.4, it seems Apple has miraculously fixed this nightmare. But for whatever reason, AOS is still problematic. If an element has a nonzero delay, it will be bugged, but zero-delay elements behave as usual. And so the solution is, unfortunately, to handle almost all of what AOS does manually.

		//This function puts the proper delays and anchors on aos elements on the page. The first animated element in every section should have a class of new-aos-section.
		load: function()
		{
			this.elements = [];
			
			let new_elements = document.querySelectorAll("[data-aos]");
			
			let current_section = 0;
			let current_delay = 0;
			
			
			
			for (let i = 0; i < new_elements.length; i++)
			{
				if (new_elements[i].classList.contains("new-aos-section"))
				{
					//Create a new section.
					this.elements.push([]);
					
					this.currently_animating.push([]);
					
					current_section++;
					
					
					
					if (new_elements[i].getAttribute("data-aos-delay") !== null)
					{
						current_delay = parseInt(new_elements[i].getAttribute("data-aos-delay"));
					}
					
					else
					{
						current_delay = 0;
					}
					
					
					
					if (new_elements[i].getAttribute("data-aos-offset") !== null)
					{
						this.anchor_offsets[current_section - 1] = parseInt(new_elements[i].getAttribute("data-aos-offset"));
					}
					
					else
					{
						this.anchor_offsets[current_section - 1] = 100;
					}
					
					
					
					new_elements[i].setAttribute("data-aos-offset", 1000000);
					new_elements[i].setAttribute("data-aos-delay", 0);
					
					
					
					this.elements[current_section - 1].push([new_elements[i], current_delay]);
					
					this.anchor_positions[current_section - 1] = new_elements[i].getBoundingClientRect().top + Page.scroll;
					
					this.anchors_shown[current_section - 1] = false;
				}
				
				
				
				else
				{
					if (new_elements[i].getAttribute("data-aos-delay-increase") !== null)
					{
						current_delay += parseInt(new_elements[i].getAttribute("data-aos-delay-increase"));
						
						if (current_delay > 2000)
						{
							current_delay = 2000;
						}
					}
					
					else if (new_elements[i].getAttribute("data-aos-delay") !== null)
					{
						current_delay = parseInt(new_elements[i].getAttribute("data-aos-delay"));
					}
					
					else
					{
						current_delay += 100;
						
						if (current_delay > 2000)
						{
							current_delay = 2000;
						}
					}
					
					
					
					new_elements[i].setAttribute("data-aos-offset", 1000000);
					new_elements[i].setAttribute("data-aos-delay", 0);
					
					this.elements[current_section - 1].push([new_elements[i], current_delay]);
				}
			}
			
			
			
			//At this point we have a list of all the AOS sections and their delays. Now whenever we scroll, we'll check each of the anchors to see if the scroll position is beyond the offset.
			
			this.on_resize();
			this.on_scroll();
		},



		on_resize: function()
		{
			for (let i = 0; i < this.elements.length; i++)
			{
				this.anchor_positions[i] = this.elements[i][0][0].getBoundingClientRect().top + Page.scroll;
			}
			
			this.fix_footer_anchor();
		},



		fix_footer_anchor: function()
		{
			if (!("no_footer" in Page.settings && Page.settings["no_footer"]))
			{
				this.anchor_positions[this.elements.length - 1] = document.body.clientHeight - 10;
			}
		},



		on_scroll: function()
		{
			for (let i = 0; i < this.elements.length; i++)
			{
				if (Page.scroll + Page.Layout.window_height >= this.anchor_positions[i] + this.anchor_offsets[i] && this.anchors_shown[i] === false)
				{
					this.show_section(i);
				}
				
				else if (Page.scroll + Page.Layout.window_height < this.anchor_positions[i] - this.anchor_offsets[i]/2 && this.anchors_shown[i] === true)
				{
					this.hide_section(i);
				}
			}
		},



		show_section: function(section)
		{
			if (Site.Settings.url_vars["content_animation"] === 1)
			{
				return;
			}
			
			
			
			for (let i = 0; i < this.elements[section].length; i++)
			{
				let refresh_id = setTimeout(() =>
				{
					this.elements[section][i][0].setAttribute("data-aos-offset", -1000000);
					
					AOS.refresh();
				}, this.elements[section][i][1]);
				
				this.currently_animating[section].push(refresh_id);
			}
			
			this.anchors_shown[section] = true;
		},



		hide_section: function(section)
		{
			try
			{
				for (let i = 0; i < this.currently_animating[section].length; i++)
				{
					clearTimeout(this.currently_animating[section][i]);
				}
			}
			
			catch(ex) {}
			
			this.currently_animating[section] = [];
			
			
			
			for (let i = 0; i < this.elements[section].length; i++)
			{
				this.elements[section][i][0].setAttribute("data-aos-offset", 1000000);
				
				AOS.refresh();
			}
			
			this.anchors_shown[section] = false;
		}
	},


	
	HoverEvents:
	{
		element_selectors: `
			a,
			
			#scroll-button,
			
			.text-button,
			.checkbox-container,
			.radio-button-container,
			
			.footer-button,
			.footer-image-link img,
			#scroll-up-button,
			
			#enter-fullscreen-button,
			#exit-fullscreen-button,
			
			.image-link img,
			
			#logo img,
			
			.nav-button,
			.big-image-horizontal,
			.small-image-horizontal,
			.big-image-vertical,
			.small-image-vertical,
			
			
			
			.root-marker
		`,
		
		
		
		//Adds a listener to every element that needs a hover event. Yes, you could use CSS for this. No, I don't want to.
		set_up: function()
		{
			let elements = document.querySelectorAll(this.element_selectors);
			
			for (let i = 0; i < elements.length; i++)
			{
				this.add(elements[i]);
			}
		},



		add: function(element)
		{
			element.addEventListener("mouseenter", () =>
			{
				if (!Site.Interaction.currently_touch_device)
				{
					element.classList.add("hover");
				}
			});
			
			element.addEventListener("mouseleave", () =>
			{
				if (!Site.Interaction.currently_touch_device)
				{
					element.classList.remove("hover");
					
					element.blur();
				}
			});
		},



		remove: function()
		{
			let elements = document.querySelectorAll(this.element_selectors);
			
			for (let i = 0; i < elements.length; i++)
			{
				elements[i].classList.remove("hover");
			}
		}
	},
	
	
	
	FocusEvents:
	{
		set_up_weird_elements: function()
		{
			let elements = document.querySelectorAll(".focus-on-child");

			for (let i = 0; i < elements.length; i++)
			{
				elements[i].addEventListener("focus", () =>
				{
					elements[i].children[0].focus();
				});
			}
		}
	},
	
	
	
	TextButtons:
	{
		set_up: function()
		{
			let bound_function = this.equalize.bind(this);
			
			window.addEventListener("resize", bound_function);
			Page.temporary_handlers["resize"].push(bound_function);
			
			setTimeout(() =>
			{
				bound_function();
			}, 50);
			
			setTimeout(() =>
			{
				bound_function();
			}, 500);
		},



		//Makes linked text buttons have the same width and height.
		equalize: function()
		{
			let elements = document.querySelectorAll(".text-button");
			
			for (let i = 0; i < elements.length; i++)
			{
				elements[i].parentNode.style.margin = "0 auto";
			}
			
			
			
			elements = document.querySelectorAll(".linked-text-button");
			
			let heights = [];
			
			let max_height = 0;
			
			let widths = [];
			
			let max_width = 0;
			
			
			
			for (let i = 0; i < elements.length; i++)
			{
				elements[i].style.height = "fit-content";
				elements[i].style.width = "fit-content";
				
				heights.push(elements[i].offsetHeight);
				
				if (heights[i] > max_height)
				{
					max_height = heights[i];
				}
				
				widths.push(elements[i].offsetWidth);
				
				if (widths[i] > max_width)
				{
					max_width = widths[i];
				}
			}
			
			
			
			for (let i = 0; i < elements.length; i++)
			{
				if (heights[i] < max_height)
				{
					elements[i].style.height = max_height + "px";
				}
				
				else
				{
					elements[i].style.height = "fit-content";
				}
				
				
				
				if (widths[i] < max_width)
				{
					elements[i].style.width = max_width + "px";
				}
				
				else
				{
					elements[i].style.width = "fit-content";
				}
			}
		}
	},



	//To keep expected link functionality (open in new tab, draggable, etc.), all elements with calls to redirect() are wrapped in <a> tags. Presses of <a> tags (without .real-link) are ignored, but to extend the functionality of url variables to the times they are used, we need to target them all and add the url variables onto them. Also, since the website is a single page app, we need to format them correctly, too, using the page variable.
	Links:
	{
		set: function()
		{
			let links = document.querySelectorAll("a");
			
			
			
			let url_vars_suffix = Page.Navigation.concat_url_vars();
			
			
			
			for (let i = 0; i < links.length; i++)
			{
				let href = links[i].getAttribute("href");
				
				if (href.slice(0, 5) !== "https" && href.slice(0, 4) !== "data" && !(links[i].parentNode.classList.contains("footer-image-link")))
				{
					links[i].setAttribute("href", "/index.html?page=" + encodeURIComponent(href) + url_vars_suffix);
				}
			}
		},



		disable: function()
		{
			let links = document.querySelectorAll("a:not(.real-link)");
			
			for (let i = 0; i < links.length; i++)
			{
				links[i].addEventListener("click", function(e)
				{
					e.preventDefault();
				});
			}
		}
	},
	

	
	Math:
	{
		typeset: function()
		{
			if (!Site.scripts_loaded["mathjax"])
			{
				Site.load_script("https://polyfill.io/v3/polyfill.min.js?features=es6");
				
				
				
				Site.load_script("https://cdn.jsdelivr.net/npm/mathjax@3.0.1/es5/tex-mml-chtml.js")
				
				.then(function()
				{
					Site.scripts_loaded["mathjax"] = true;
				})
				
				.catch(function(error)
				{
					console.error("Could not load MathJax");
				});
			}
			
			else
			{
				MathJax.typeset();
			}
			
			
			
			setTimeout(function()
			{
				let elements = document.querySelectorAll("mjx-container");
				
				for (let i = 0; i < elements.length; i++)
				{
					elements[i].setAttribute("tabindex", -1);
				}
			}, 500);
		}
	}
};