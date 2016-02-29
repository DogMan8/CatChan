CatChan
=======

Cross Domain Catalog for Imageboards<br>
Functions:<br>
1. Cross Board/Domain Catalog<br>
2. Tagging Support<br>
3. Show statistics<br>
4. Unique IP tracker for 4chan<br>
5．Reader Support for Slower Threads/Boards<br>
This is a userscript. You need Greasemonkey (Firefox) or Tampermonkey (Chrome) beforehand.<br>
Then click following link to install.<br>
<h1><a href="https://raw.github.com/Dogman8/CatChan/master/CatChan.user.js">[GET USERSCRIPT STABLE]</a></h1><br>
<a href="https://raw.github.com/Dogman8/CatChan/develop/CatChan.user.js">[GET USERSCRIPT BETA]</a><br>

Copyright (c) 2014 DogMan8<br>
See the LICENSE file for license rights and limitations (GPLv3).<br>


<h1>Note</h1><br>
Chrome 48 may have a memory leak. Use chrome 50, 49 or 47 instead of 48 if you can. In my environment,<br>
- No leaks on Chrome 50.0.2630.1 canary SyzyASan.<br>
- No leaks on Chrome 49.0.2623.28 beta-m.<br>
- Leaks 1-2MB/hour on Chrome 48.0.2564.97 m.<br>
- No leaks on chrome 47.0.2526.111 m.<br>
You can test these using CatChan with the same setting 'active virtual boards in 4chan' in EasySetting.
<br>

Chrome 49 has a bug around ChannelMessage, memory will leak when you access other sites with CatChan. The tab will hang up after 3-7 days. When you use CatChan in a site and you don't access to other sites, memory won't leak. I reported this, https://code.google.com/p/chromium/issues/detail?id=581335 <br>
<br>
How to reproduce the bug: (49.0.2623.0 canary)<br>
1. Install ChannelMessage.user.js. <br>
2. Open any page, for example, https://developer.mozilla.org/en-US/docs/Web/API/Channel_Messaging_API/Using_channel_messaging<br>
3. Check amount of JS Heap using DeveloperTool. It's about 6-8MB probably. Don't forget to do GC before check.<br>
4. Click "START". Then messages are send and received continuously.<br>
5. Re-check amount of JS Heap. It's increasing. Don't forget to do GC before check.<br>
6. It will increase up to 2GB or more and the tab will hang up after 3-7 days. However, usage of virtual memory in system<br> DOESN'T increase. You can see this fact using process explorer.<br>
7. If you decrease size of messages to 100KB, memory doesn't leak so much. I tested cases of 200KB or 400KB, they behave about the same as the case of 100KB, it doesn't leak so much. I haven't found threshold.<br>
8. Now I tested version 50.0.2630.1 canary SyzyASan, the bug seems to be reproduced so far.<br>
<br> 
Chrome43 has a bug around DesktopNotification. If you encounter this bug, use canary version of chrome(chrome46) or stop using DesktopNotification. You can check this by pasting chrome_crasher.user.js to your console. Chrome will be crashed around 3275th DesktopNotificaton by the script.<br>
<br>

<h1>History</h1><br>
v2016.02.28.0: Fixed bugs and Cleaned up.<br>
v2016.02.21.3, v2016.02.21.2: Fixed a bug in infinite scroll.(degrade)<br>
v2016.02.21.1: Fixed a bug.(degrade)<br>
v2016.02.21.0: Cleaned up.<br>
v2016.02.14.1: Modified recovery function and cleaned up. (v2016.02.14.0 had a bug and was discarded.)<br>
v2016.02.07.0: Prioritized requests, fixed bugs in 4chan.<br>
v2016.01.31.0: Added style setter and recovery function, which recovers editing message when browser was crashed.<br>
v2016.01.17.0: Fixed bugs.<br>
v2016.01.10.0: Fixed bugs, added meguca support and passive mode.<br>
v2016.01.03.0: Added functions of importing from meguca and mixing index pages from supported sites in lainchan.<br>
v2015.12.27.0: Fixed bugs.<br>
v2015.12.20.0: Fixed bugs.(degrade)<br>
v2015.12.06.0: Fixed bugs.(degrade)<br>
v2015.11.29.0: Fixed bugs.(degrade)<br>
v2015.11.22.0: Fixed bugs.(degrade)<br>
v2015.11.08.0: Cleaned up.<br>
v2015.11.01.0: Fixed bugs.(degrade)<br>
v2015.10.25.0: Improved memory usage and added virtual board function to index page.<br>
v2015.10.18.0: Improved memory usage and added support for boards' tag in 8chan.<br>
v2015.10.12.0: Improved robustness.<br>
v2015.10.09.0: Added a virtual board function.<br>
v2015.09.23.0: Cleaned up.<br>
v2015.08.01.0: Cleaned up.<br>
v2015.06.13.0: Cleaned up.<br>
v2015.05.30.0: Cleaned up.<br>
v2015.05.26.0: Patched a bug.(degrade)<br>
v2015.05.23.0: Cleaned up.<br>
v2015.05.19.0: Fixed bugs.(degrade)<br>
v2015.05.16.0: Fixed a bug.(degrade in scanning by keywords)<br>
v2015.05.14.0: Cleaned up and Tuned up.<br>
v2015.05.13.0: Fixed a bug.(degrade in Tampermonkey)<br>
v2015.05.03.0: Cleaned up.<br>
v2015.04.26.0: Quick patch for recent change in 8chan.<br>
v2015.04.18.0: Cleaned up and gave basic support for KC's native catalog.<br>
v2015.04.11.1: Fixed a bug in 4chan's native catalog.<br>
v2015.04.11.0: Cleaned up and gave basic support for 4chan's native catalog.<br>
v2015.04.04.0: Cleaned up and added text mode.<br>
v2015.03.28.0: Cleaned up and tuned.<br>
v2015.03.21.0: Cleaned up.<br>
v2015.03.17.1: Fixed a bug.(degrade)<br>
v2015.03.14.1: Changed a specification.<br>
v2015.03.14.0: Tuned and added some functions.<br>
v2015.03.08.0: Added sync function between catalog and thread.<br>
v2015.03.03.0-v2015.03.02.0: Fixed many inconsistencies, added an option.<br>
v2015.03.01.2-v2015.03.01.1: A bug and size of setting window are Fixed.<br>
v2015.03.01.0: Added watcher function.<br>
v2015.02.14.0: Added thread-tagging.<br>
v2015.02.04.0: Added sound notifier.<br>
v2015.01.24.0: Added a scan function.<br>
v2015.01.16.1: Fixed a bug.(degrade)<br>
v2015.01.16.0: Added health indicator.<br>
v2015.01.14.0: Supported 8ch.net.<br>
v2015.01.12.0: Added function of exporting configuration.<br>
v2015.01.05.0: Added merging boards function to native catalog support.<br>
v2014.12.21.0: Fixed a bug in Tampermonkey.(degrade)<br>
v2014.12.20.0: Added support for native catalog in 8chan.<br>
v2014.12.14.2-v2014.12.14.1: Added capability to use "http" for 8chan.<br>
v2014.12.14.0: Initial Release.<br>
