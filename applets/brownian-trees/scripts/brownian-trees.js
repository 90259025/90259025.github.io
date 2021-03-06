!function()
{
	"use strict";
	
	
	
	let grid_size = null;
	
	let ctx = document.querySelector("#output-canvas").getContext("2d", {alpha: false});
	
	let web_worker = null;
	
	
	
	
	
	document.querySelector("#generate-button").addEventListener("click", request_brownian_tree);
	
	document.querySelector("#grid-size-input").addEventListener("keydown", function(e)
	{
		if (e.keyCode === 13)
		{
			request_brownian_tree();
		}
	});
	
	document.querySelector("#download-button").addEventListener("click", prepare_download);
	
	
	
	if (Browser.name === "Chrome" || Browser.name === "Opera")
	{
		alert_about_hardware_acceleration();
	}
	
	
	
	Page.Applets.Canvases.to_resize = [document.querySelector("#output-canvas")];
	
	Page.Applets.Canvases.true_fullscreen = false;
	
	Page.Applets.Canvases.set_up_resizer();
	
	
	
	function request_brownian_tree()
	{
		let grid_size = parseInt(document.querySelector("#grid-size-input").value || 1000);
		
		
		
		document.querySelector("#output-canvas").setAttribute("width", grid_size);
		document.querySelector("#output-canvas").setAttribute("height", grid_size);
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, grid_size, grid_size);
		
		
		
		document.querySelector("#progress-bar span").insertAdjacentHTML("afterend", `<span></span>`);
		document.querySelector("#progress-bar span").remove();
		
		
		
		try {web_worker.terminate();}
		catch(ex) {}
		
		if (DEBUG)
		{
			web_worker = new Worker("/applets/brownian-trees/scripts/worker.js");
		}
		
		else
		{
			web_worker = new Worker("/applets/brownian-trees/scripts/worker.min.js");
		}
		
		Page.temporary_web_workers.push(web_worker);
		
		
		
		web_worker.onmessage = function(e)
		{
			if (e.data[0] === "progress")
			{
				document.querySelector("#progress-bar span").style.width = e.data[1] + "%";
				
				if (e.data[1] === 100)
				{
					setTimeout(function()
					{
						document.querySelector("#progress-bar").style.opacity = 0;
						
						setTimeout(function()
						{
							document.querySelector("#progress-bar").style.marginTop = 0;
							document.querySelector("#progress-bar").style.marginBottom = 0;
						}, 300);
					}, 600);
				}
			}
			
			
			
			else if (e.data[0] === "done")
			{
				document.querySelector("#progress-bar").style.opacity = 0;
				
				setTimeout(function()
				{
					document.querySelector("#progress-bar").style.marginTop = 0;
					document.querySelector("#progress-bar").style.marginBottom = 0;
				}, 300);
			}
			
			
			
			else
			{
				ctx.fillStyle = e.data[2];
				
				ctx.fillRect(e.data[0], e.data[1], 1, 1);
			}
		}
		
		
		
		document.querySelector("#progress-bar span").style.width = 0;
		document.querySelector("#progress-bar").style.marginTop = "10vh";
		document.querySelector("#progress-bar").style.marginBottom = "-5vh";
		
		setTimeout(function()
		{
			document.querySelector("#progress-bar").style.opacity = 1;
		}, 600);
		
		
		
		web_worker.postMessage([grid_size]);
	}
	
	
	
	function prepare_download()
	{
		let link = document.createElement("a");
		
		link.download = "brownian-tree.png";
		
		link.href = document.querySelector("#output-canvas").toDataURL();
		
		link.click();
		
		link.remove();
	}
	
	
	
	function alert_about_hardware_acceleration()
	{
		let elements = document.querySelector("main").children;
		
		elements = elements[elements.length - 1].children;
		
		elements[elements.length - 1].insertAdjacentHTML("afterend", `
			<div data-aos="fade-up" style="margin-top: 10vh">
				<p class="body-text">
					Your browser treats canvases in a way that may make this applet stutter excessively. If this happens, try temporarily turning off hardware acceleration in the browser&#x2019;s settings.
				</p>
			</div>
		`);
		
		Page.Load.AOS.on_resize();
	}
}()