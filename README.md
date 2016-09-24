# FIUBA KeplerOrbit
***Under development***

![alt tag](https://github.com/sebastian-sampayo/FIUBA-KeplerOrbit/blob/master/screenshots/yet%20another%20screenshot.png)

This is a WebGL application programmed during my Thesis. The idea is to take screenshots from it to use in the report. Furthermore, it will be used in my presentation during the Thesis defense, to explain astronomic terminology and classical elements of a keplerian orbit.

## Description
This application draws the Earth, the satellite, it's orbit, some common frames and reference objects used in my Thesis work. It is still under development, there are several things that don't show up in the gui controller, but are already coded. The way to see them is by making "true" the "visible" attribute from them, by hand, in the F12 console, or directly in the code. In some weeks it will be ready, with every option available.

## Browser issues
Chrome browser has some problems running WebGL local applications. It's very common that an object with textures doesn't show up. On the other hand, if you use Firefox, normally there's no problem.
>If you use Chrome you need to add "--allow-file-access-from-files" to the "index.html" shortcut to enable the use of textures on your machine. Make sure all Chrome processes in the Task Manager are shut down before restarting Chrome with this option. Note that even rebooting won't assure this - chrome.exe processes will often occur on startup. You have to kill these by hand and then run your shortcut. See http://www.chrome-allow-file-access-from-file.com/ for more details. 

[cite of the course "Interactive 3D Graphics" from Udacity]

Another possibility, is to run a local server on your machine using Python, for instance. Just open up a shell/terminal/command line and type: 
```
$ cd [repo-path]
$ python -m http.server 8000
```
and then in your browser go to:
http://localhost:8000
