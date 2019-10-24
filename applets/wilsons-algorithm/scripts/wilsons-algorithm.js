!function()
{
	let grid_size = null;
	
	let ctx = document.querySelector("#grid-graph").getContext("2d");
	
	
	
	adjust_for_settings();



	document.querySelector("#generate-button").addEventListener("click", request_wilson_graph);
	
	
	
	let web_worker = null;
	
	if (DEBUG)
	{
		web_worker = new Worker("/applets/wilsons-algorithm/scripts/worker.js");
	}
	
	else
	{
		web_worker = new Worker("/applets/wilsons-algorithm/scripts/worker.min.js");
	}
	
	
	
	web_worker.onmessage = function(e)
	{
		if (e.data[0] === "done")
		{
			prepare_download();
		}
		
		else
		{
			ctx.fillRect(e.data[0], e.data[1], e.data[2], e.data[3]);
		}
	}
	
	
	
	
	
	function request_wilson_graph()
	{
		grid_size = parseInt(document.querySelector("#dim-input").value || 100);
	
	
	
		document.querySelector("#grid-graph").setAttribute("width", 2 * grid_size + 1);
		document.querySelector("#grid-graph").setAttribute("height", 2 * grid_size + 1);
		
		
		
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillRect(0, 0, 2 * grid_size + 1, 2 * grid_size + 1);
		
		ctx.fillStyle = "rgb(255, 255, 255)";
		
		
		
		web_worker.postMessage([grid_size]);
	}
	
	
	
	function prepare_download()
	{
		try
		{
			document.querySelector("#download-button").style.classList.add("animated-opacity");
			document.querySelector("#download-button").style.opacity = 0;
		}
		
		catch(ex) {}
		
		setTimeout(function()
		{
			try {document.querySelector("#download-button").remove();}
			catch(ex) {}
			
			let image_data = document.querySelector("#grid-graph").toDataURL();
			
			
			
			document.querySelector("#download-location").insertAdjacentHTML("afterend", `
				<div id="download-button" class="animated-opacity" data-aos="zoom-out">
					<a href="${image_data}" download="wilson.png" class="real-link">
						<button class="text-button" type="button" onclick="">Download Image</button>
					</a>
				</div>
			`);
		}, 300);
	}



	function adjust_for_settings()
	{
		if (url_vars["contrast"] == 1)
		{
			if (url_vars["theme"] == 1)
			{
				document.querySelector("#grid-graph").style.borderColor = "rgb(192, 192, 192)";
			}
			
			else
			{
				document.querySelector("#grid-graph").style.borderColor = "rgb(64, 64, 64)";
			}
		}
	}
}()