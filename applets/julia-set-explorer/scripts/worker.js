"use strict";



onmessage = async function(e)
{
	await draw_julia_set(...e.data);
}



let image = [];



function draw_julia_set(a, b, julia_size, num_iters)
{
	return new Promise(function(resolve, reject)
	{
		image = [];
		
		for (let i = 0; i < julia_size; i++)
		{
			image[i] = [];
		}
		
		
		
		let progress_step = Math.floor(julia_size / 20);
		
		//Generate the brightness map.
		for (let i = 0; i < julia_size / 2; i++)
		{
			julia_row(i, a, b, julia_size, num_iters);
			
			if (i % progress_step === 0)
			{
				postMessage(["progress", i / progress_step * 10]);
			}
		}
		
		postMessage(["progress", 100]);
		
		
		
		//Find the max brightness, throwing out the very top values to avoid almost-black images with a few specks of color.
		let brightness_array = image.flat().sort(function(a, b) {return a - b});
		
		let max_brightness = brightness_array[Math.round(brightness_array.length * .9999) - 1];
		
		
		
		for (let i = 0; i < julia_size; i++)
		{		
			image[i] = image[i].map(brightness => (brightness / max_brightness) * 255);
		}
		
		
		
		postMessage([image]);
		
		resolve();
	});
}



function julia_row(i, a, b, julia_size, num_iters)
{
	for (let j = 0; j < julia_size + 1; j++)
	{
		let x = ((j - julia_size/2) / julia_size) * 4;
		let y = (-(i - julia_size/2) / julia_size) * 4;
		
		let brightness = Math.exp(-Math.sqrt(x*x + y*y));
		
		let k = 0;
		
		for (k = 0; k < num_iters; k++)
		{
			let temp_x = x*x - y*y + a;
			let temp_y = 2*x*y + b;
			
			x = temp_x;
			y = temp_y;
			
			brightness += Math.exp(-Math.sqrt(x*x + y*y));
			
			if (x*x + y*y > 4)
			{
				break;
			}
		}
		
		if (k === num_iters)
		{
			brightness = 0;
		}
		
		
		
		//Reflect the top half about the origin to get the bottom half.
		image[i][j] = brightness;
		image[julia_size - i - 1][julia_size - j] = brightness;
	}
}