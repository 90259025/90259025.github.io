!function()
{
	"use strict";
	
	
	
	let ctx = document.querySelector("#output-canvas").getContext("2d", {alpha: false});
	
	let web_worker = null;
	
	
	
	
	
	document.querySelector("#generate-button").addEventListener("click", request_lorenz_attractor);
	
	let elements = document.querySelectorAll("#grid-size-input, #sigma-input, #rho-input, #beta-input");
	
	for (let i = 0; i < elements.length; i++)
	{
		elements[i].addEventListener("keydown", function(e)
		{
			if (e.keyCode === 13)
			{
				request_lorenz_attractor();
			}
		});
	}
	
	document.querySelector("#download-button").addEventListener("click", prepare_download);
	
	
	
	
	
	function request_lorenz_attractor()
	{
		let grid_size = parseInt(document.querySelector("#grid-size-input").value || 1000);
		
		let sigma = parseFloat(document.querySelector("#sigma-input").value || 10);
		
		let rho = parseFloat(document.querySelector("#rho-input").value || 28);
		
		let beta = parseFloat(document.querySelector("#beta-input").value || 8/3);
		
		let maximum_speed = document.querySelector("#toggle-maximum-speed-checkbox").checked;
		
		
		
		document.querySelector("#output-canvas").setAttribute("width", grid_size);
		document.querySelector("#output-canvas").setAttribute("height", grid_size);
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, grid_size, grid_size);
		
		
		
		try {web_worker.terminate();}
		catch(ex) {}
		
		if (DEBUG)
		{
			web_worker = new Worker("/applets/strange-attractors/scripts/worker.js");
		}
		
		else
		{
			web_worker = new Worker("/applets/strange-attractors/scripts/worker.min.js");
		}
		
		temporary_web_workers.push(web_worker);
		
		
		
		web_worker.onmessage = function(e)
		{
			postMessage(e.data);
			
			let pixels = e.data[0];
			
			let rgb = e.data[1];
			
			ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
			
			for (let i = 0; i < pixels.length; i++)
			{
				ctx.fillRect(pixels[i][1], pixels[i][0], 1, 1);
			}
		}
		
		
		
		web_worker.postMessage([grid_size, sigma, rho, beta, maximum_speed]);
	}
	
	
	
	function prepare_download()
	{
		let link = document.createElement("a");
		
		link.download = "strange-attractor.png";
		
		link.href = document.querySelector("#output-canvas").toDataURL();
		
		link.click();
		
		link.remove();
	}
}()