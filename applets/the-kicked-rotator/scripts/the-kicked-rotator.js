!function()
{
	"use strict";
	
	
	
	let grid_size = null;
	
	let ctx = document.querySelector("#kicked-rotator-graph").getContext("2d");
	
	let web_worker = null;
	
	
	
	let image = [];
		
	let unvisited_points = [];
	
	let num_paths = 1;
	
	let current_row = null;
	let current_col = null;
	
	let current_p = null;
	let current_theta = null;
	
	let max_iterations = null;
	
	let max_repetitions = 100;
	
	let K = null;
	
	
	
	
	
	adjust_for_settings();
	
	
	
	document.querySelector("#generate-button").addEventListener("click", request_kicked_rotator);
	
	document.querySelector("#grid-size-input").addEventListener("keydown", function(e)
	{
		if (e.keyCode === 13)
		{
			request_kicked_rotator();
		}
	});
	
	document.querySelector("#download-button").addEventListener("click", prepare_download);
	
	
	
	
	
	function request_kicked_rotator()
	{
		grid_size = parseInt(document.querySelector("#grid-size-input").value || 250);
		
		K = parseFloat(document.querySelector("#k-input").value || .6);
		
		max_iterations = grid_size * 2;
		
		
		
		document.querySelector("#kicked-rotator-graph").setAttribute("width", grid_size);
		document.querySelector("#kicked-rotator-graph").setAttribute("height", grid_size);
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, grid_size, grid_size);
		
		
		
		try {web_worker.terminate();}
		catch(ex) {}
		
		if (DEBUG)
		{
			web_worker = new Worker("/applets/the-kicked-rotator/scripts/worker.js");
		}
		
		else
		{
			web_worker = new Worker("/applets/the-kicked-rotator/scripts/worker.min.js");
		}
		
		temporary_web_workers.push(web_worker);
		
		
		
		web_worker.onmessage = function(e)
		{
			let points = e.data[0];
			let color = e.data[1];
			
			let rgb = HSVtoRGB(color, 1, 1);
			
			ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
			
			for (let i = 0; i < points.length; i++)
			{
				ctx.fillRect(points[i][1], points[i][0], 1, 1);
			}
		}
		
		
		
		web_worker.postMessage([grid_size, K, .33]);
	}
	
	
	
	function HSVtoRGB(h, s, v)
	{
		let r, g, b, i, f, p, q, t;
		
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		
		switch (i % 6)
		{
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}
	    
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
	
	
	
	function prepare_download()
	{
		let link = document.createElement("a");
		
		link.download = "kicked-rotator.png";
		
		link.href = document.querySelector("#kicked-rotator-graph").toDataURL();
		
		link.click();
		
		link.remove();
	}



	function adjust_for_settings()
	{
		if (url_vars["contrast"] === 1)
		{
			if (url_vars["theme"] === 1)
			{
				document.querySelector("#kicked-rotator-graph").style.borderColor = "rgb(192, 192, 192)";
			}
			
			else
			{
				document.querySelector("#kicked-rotator-graph").style.borderColor = "rgb(64, 64, 64)";
			}
		}
	}
}()