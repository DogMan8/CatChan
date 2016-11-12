#!/bin/sh
#
# archive_extractor dir_src dir_target

src=$1
dst=$2
if [ "$src" = "" ]; then src=".";fi
if [ "$dst" = "" ]; then dst=".";fi

#echo $src
#echo $dst

while :
do
    #ls -1 $src/CatChan_archive_updates_*tar | xargs -n 1 tar vxf
    fs=`ls -1 $src/CatChan_archive_updates_*tar 2>&1`
    if [ $? -eq 0 ];then
        for f in $fs
        do
            echo $f
#            tar vxf $f -C "$dst"
            tar xf $f -C "$dst"
            if [ $? -eq 0 ]; then rm $f; else mv $f $f.error; fi
        done
    fi
    sleep 30
done


