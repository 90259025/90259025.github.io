let old_layout = "";



window.addEventListener("resize", resize_update);



//Yes, I know this is weird. But it's the only way I know to make banner opacity work smoothly.

let resize_time = 0;
let new_window_width = 0, new_window_height = 0;
let window_width_step_distance = 0, window_height_step_distance = 0;

function resize_update()
{
	//Everything here can be done immediately.
	let new_window_width = window.innerWidth;
	let new_window_height = window.innerHeight;
	
	old_layout = layout_string;
	
	if (new_window_width / new_window_height < 9/16 || new_window_width <= 700)
	{
		layout_string = "small-screen";
	}
	
	else
	{
		layout_string = "compact";
	}
	
	if (layout_string != old_layout && url_vars["content_layout"] != 1)
	{
		try {document.querySelector("#content-layout-button-text").textContent = `Content layout: automatic (currently ${layout_string})`;}
		catch(ex) {}
	}
	
	
	
	//The banner opacity is the big sticking point, though. The solution is to increase the window height slowly and fire scroll events in rapid succession.
	resize_time = 0;
	
	window_width_step_distance = (new_window_height - window_height) * (8 / 300);
	window_height_step_distance = (new_window_height - window_height) * (8 / 300);
	
	let refresh_id = setInterval(function()
	{
		resize_step();
		
		if (resize_time >= 300)
		{
			clearInterval(refresh_id);
			
			window_width = new_window_width;
			window_height = new_window_height;
			
			scroll_update();
		}
	}, 8);
}



function resize_step()
{
	window_width += window_width_step_distance;
	window_height += window_height_step_distance;
	
	resize_time += 8;
	
	scroll_update();
}