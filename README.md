[CatChan](https://github.com/DogMan8/CatChan/wiki)
=======

Cross Domain Catalog for Imageboards<br>
Functions:<br>
2. [Virtual board](https://github.com/DogMan8/CatChan/wiki/VirtualBoard) system<br>
3. [Statistics](https://github.com/DogMan8/CatChan/wiki/Statistics)<br>
4. [Archiver](https://github.com/DogMan8/CatChan/wiki/Archiver)<br>
5. Other functions<br>
&emsp;&emsp;[Incremental search from posts in entire sites](https://github.com/DogMan8/CatChan/wiki/Search)<br>
6. Misc.<br>
<br>
This is a userscript. You need [Greasemonkey](https://addons.mozilla.org/ja/firefox/addon/greasemonkey/) (for Firefox) or [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) (for Chrome) beforehand. Then click following link to install.<br>
<h1><a href="https://raw.github.com/Dogman8/CatChan/master/CatChan.user.js">[GET USERSCRIPT STABLE]</a></h1><br>
<a href="https://raw.github.com/Dogman8/CatChan/develop/CatChan.user.js">[GET USERSCRIPT BETA]</a><br>

Copyright (c) 2014 DogMan8<br>
See the LICENSE file for license rights and limitations (AGPLv3).<br>

You can contact with me in following threads for development.<br>
[meguca.org/g](https://meguca.org/g/1841607)<br>

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
v2018.03.18.0: Added a patch for archiver in meguca.<br>
v2018.03.04.0: Added catalog enhancement in 4chan.<br>
v2018.02.18.0: Fixed bugs and added catalog enhancement in 4chan.<br>
v2017.10.22.0: Fixed a bug in meguca.<br>
v2017.10.15.0: Fixed a bug in KC.<br>
v2017.08.13.0: Fixed bugs.(degrade)<br>
v2017.07.23.0: Fixed bugs.<br>
v2017.07.16.0: Fixed bugs. Archiver works in meguca.<br>
v2017.07.09.0: Added flag support in meguca.<br>
v2017.07.02.1-0: Changed to accord with meguca's spec change.<br>
v2017.06.25.1-0: Fixed a bug.(degrade)<br>
v2017.06.18.3-0: Added sage detector in 4chan.<br>
v2017.06.11.1: Fixed a bug.(degrade)<br>
v2017.06.11.0: Fixed bugs, added thread merging and support for historyAPI in meguca. License was changed to AGPLv3.<br>
v2017.05.07.5-0: <a href="https://meguca.org/g/1841607#p2018782">lainchan.jp is kill</a>, but give support for USERS.<br>
v2017.04.09.0: Fixed bugs.<br>
v2017.04.02.0: Fixed bugs.<br>
v2017.03.19.0: Bug fix and support new JSON/API of meguca.<br>
v2017.02.19.0: Quick patch for meguca and bug fix.<br>
v2017.02.05.0: Quick patch for meguca.<br>
v2017.01.22.0: Functions of archiving were changed to opt-out.<br>
v2016.12.25.0: Fixed bugs.<br>
v2016.12.11.1-0: Fixed bugs, added Full_IDB mode, gave a quick patch for meguca v3<br>
v2016.12.04.0, v2016.11.13.3-1: Fixed bugs.<br>
v2016.11.13.0: Archiver/Delayed Pruning are added.<br>
v2016.10.16.3: Fixed a bug.(degrade)<br>
v2016.10.16.2: Fixed a bug.<br>
v2016.10.16.1: Supported Meguca's native catalog, and added a search bar in virtual boardlist.<br>
v2016.10.16.0: Meguca v2 exporter was added.<br>
v2016.08.14.2-1: Fixed bugs.<br>
v2016.08.14.0: Supported index page in KC.<br>
v2016.07.24.0: Added historical lazy control to posts search.<br>
v2016.07.17.0: Tuned and cleaned up, added stored search function.<br>
v2016.06.19.2-1: Fixed a bug.(degrade)<br>
v2016.06.19.0: Fixed a bug.<br>
v2016.06.12.0: Fixed a bug.<br>
v2016.05.22.0: Tuned up.<br>
v2016.05.15.0: Improved statistics, cleaned up and tuned.<br>
v2016.05.08.2-v2016.05.08.1: Fixed a bug.<br>
v2016.05.08.0: Re-implemented statistics function.<br>
v2016.04.24.2-v2016.04.24.1: Changed link of Chart.js in header.<br>
v2016.04.24.0: Tuned up.<br>
v2016.04.17.1, v2016.03.13.3: Fixed a critical bug.(degrade)<br>
v2016.04.17.0: Added expander in page viewer.<br>
v2016.04.13.2: Fixed a bug at refresh.<br>
v2016.04.13.1: Fixed a bug in thread viewer.<br>
v2016.04.13.0: Fixed a bug in triage system.<br>
v2016.03.06.0: Cleaned up.<br>
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
