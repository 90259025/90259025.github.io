"use strict";



//The central script. Handles starting up all the machinery and also contains a few utility functions.



let DEBUG = false;



let window_width = null, window_height = null;

let page_settings = {};

let current_url = decodeURIComponent(get_url_var("page"));

let parent_folder = "/";

//Whether this is a touchscreen device on the current page. It's assumed to be false on every page until a touchstart or touchmove event is detected, at which point it's set to true.
let currently_touch_device = true;

let mousemoves_to_invalidate = 30;



//Whether the browser supports WebP images or not. Given a boolean value when decided.
let supports_webp = null;

let scripts_loaded = 
{
	"disqus": false,
	"mathjax": false
}

let temporary_handlers =
{
	"scroll": [],
	"resize": [],
	
	"touchstart": [],
	"touchmove": [],
	"touchend": [],
	
	"mousedown": [],
	"mousemove": [],
	"mouseup": []
}

let temporary_web_workers = [];

let layout_string = "";

let background_color_changed = false;



//A list of lists. Each sublist starts with an anchor, then lists all the elements anchored to it in sequence, along with their delays.
let aos_elements = [];

let aos_anchor_positions = [];

let aos_anchor_offsets = [];

let aos_anchors_shown = [];

let aos_currently_animating = [];



//A list of things that need to be fetched (for example, banners that need to be preloaded). The items at the start of the list get fetched first.
let fetch_queue = [];

let currently_fetching = false;



let last_touch_x = null, last_touch_y = null;

document.documentElement.addEventListener("touchstart", handle_touch_event, false);
document.documentElement.addEventListener("touchmove", handle_touch_event, false);

function handle_touch_event(e)
{
	last_touch_x = e.touches[0].clientX;
	last_touch_y = e.touches[0].clientY;
	
	if (currently_touch_device === false)
	{
		remove_hover_events();
		
		currently_touch_device = true;
		
		mousemoves_to_invalidate = 30;
	}
}



document.documentElement.addEventListener("mousemove", function()
{
	if (currently_touch_device)
	{
		if (mousemoves_to_invalidate > 0)
		{
			mousemoves_to_invalidate--;
			
			return;
		}
		
		
		
		add_hover_events();
		
		//This seriously shouldn't be necessary.
		disable_links();
		
		currently_touch_device = false;
	}
});





//Redirects to the chosen page and sets up all the miscellaneous things that make the site work.
async function entry_point(url)
{
	window_width = window.innerWidth;
	window_height = window.innerHeight;
	
	resize_update();
	
	if ("scrollRestoration" in history)
	{
		history.scrollRestoration = "manual";
	}
	
	
	
	//When in PWA form, disable text selection, drag-and-drop, and the PWA button itself.
	if (window.matchMedia("(display-mode: standalone)").matches)
	{
		document.documentElement.style.WebkitUserSelect = "none";
		document.documentElement.style.userSelect = "none";
		document.documentElement.style.WebkitTouchCallout = "none";
		
		let elements = document.querySelectorAll("body *");
		for (let i = 0; i < elements.length; i++)
		{
			elements[i].setAttribute("draggable", "false");
		}
		
		
		
		
		//Also add a little extra spacing at the top of each page to keep content from feeling too close to the top of the screen.
		add_style(`
			#pwa-button
			{
				display: none;
				width: 0px;
				height: 0px;
			}
			
			#logo, .name-text-container, .empty-top
			{
				margin-top: 2vh;
			}
		`, false);
	}
	
	
	
	scroll_button_exists = false;
	
	
	
	AOS.init({duration: 1200, once: false, offset: window_height / 4});
	
	window.addEventListener("scroll", aos_scroll);
	window.addEventListener("resize", aos_resize);
	
	
	
	init_settings();
	
	
	
	check_webp()
	
	.then(function()
	{
		//If it's not an html file, it shouldn't be anywhere near redirect().
		if (url.substring(url.lastIndexOf(".") + 1, url.length) !== "html")
		{
			//This should really be using history.replaceState(), but that doesn't update the page to make the file show for some reason.
			window.location.href = url;
		}
		
		else
		{
			redirect(url, false, true);
		}
	});
}



//Loads a script with the given source and returns a promise for when it completes.
function load_script(src)
{
	return new Promise(function(resolve, reject)
	{
		const script = document.createElement("script");
		document.body.appendChild(script);
		script.onload = resolve;
		script.onerror = reject;
		script.async = true;
		script.src = src;
	});
}



//Adds a style tag to <head> with the given content. If temporary is true, it will be removed at the next page load. Returns the style element added.
function add_style(content, temporary = true, at_beginning_of_head = false)
{
	let element = document.createElement("style");
	
	element.textContent = content;
	
	if (temporary)
	{
		element.classList.add("temporary-style");
	}
	
	
	
	if (at_beginning_of_head)
	{
		document.head.insertBefore(element, document.head.firstChild);
	}
	
	else
	{
		document.head.appendChild(element);
	}
	
	
	
	return element;
}



//Sets a whole bunch of elements' styles at once.
function set_element_styles(query_string, property, value)
{
	let elements = document.querySelectorAll(query_string);
	
	for (let i = 0; i < elements.length; i++)
	{
		elements[i].style.setProperty(property, value);
	}
}