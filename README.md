# FIUBA KeplerOrbit
This is a WebGL application programmed during my Thesis. The idea is to take captures from it to use in the inform. Furthermore, it will be used in my presentation during the Thesis defense, to explain astronomic terminology and classical elements of a keplerian orbit.

## Browser issues
Chrome browser has some problems running WebGL local applications. It's very common that an object with textures doesn't show up. On the other hand, if you use Firefox, normally there's no problem.
>If you use Chrome you need to add "--allow-file-access-from-files" to the "index.html" shortcut to enable the use of textures on your machine. Make sure all Chrome processes in the Task Manager are shut down before restarting Chrome with this option. Note that even rebooting won't assure this - chrome.exe processes will often occur on startup. You have to kill these by hand and then run your shortcut. See http://www.chrome-allow-file-access-from-file.com/ for more details. 

[cite of the course "Interactive 3D Graphics" from Udacity]

Another possibility, a more secure one, is to run a local server on your machine using Python, for instance. Just open up a shell/terminal/command line and type: 
```
$ cd [repo-path]
$ python -m http.server 8000
```
and then in your browser go to:
http://localhost:8000
