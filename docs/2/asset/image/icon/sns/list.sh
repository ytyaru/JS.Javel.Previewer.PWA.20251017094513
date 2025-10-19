#!/usr/bin/env bash
set -Ceu
#---------------------------------------------------------------------------
# このディレクトリのPNGとSVGを一覧する。ファイルサイズを添えて。SVGはligth/dark対応か判定する
# CreatedAt: 2022-05-21
#---------------------------------------------------------------------------
Run() {
	THIS="$(realpath "${BASH_SOURCE:-0}")"; HERE="$(dirname "$THIS")"; PARENT="$(dirname "$HERE")"; THIS_NAME="$(basename "$THIS")"; APP_ROOT="$PARENT";
	cd "$HERE"

	pretty() { # ファイルサイズを省略形で表示する。
		local size="$1"
		local unit='B'
		local unit_size=1
		local GB=$(( 1000 ** 3 ))
		local MB=$(( 1000 ** 2 ))
		local KB=1000
		[ $GB -le $size ] && { unit='GB'; unit_size=$GB; } || :
		[ $MB -le $size ] && { unit='MB'; unit_size=$MB; } || :
		[ $KB -le $size ] && { unit='KB'; unit_size=$KB; } || :
		local ans=$(echo "scale=1;${size}/${unit_size}" | bc)
		#echo "$ans $unit"
		echo "${ans%\.0} $unit"
	}
	# SVGの<style>中にlight/darkがあるか判定
	hasColorScheme() {
		if cat "$1" | grep -q 'prefers-color-scheme:'; then
			echo '⭕'
		else
			echo '❌'
		fi
	}

	# ファイルサイズが4KB単位であり精密でない
#	ls -1hs | grep -e .png -e .svg

	run() {
		# ファイルサイズがB単位で精密である
		for file in `ls -1 | grep -e .png -e .svg`; do
			local size=$(wc -c "${file}" | cut -f1 -d' ')
			local hasColorScheme=''
			local ext=${file##*.}
			[ $ext == 'svg' ] && hasColorScheme="$(hasColorScheme "${file}")" || :;
			echo "${file}	$(pretty $size)	${size}	${hasColorScheme}"
		done
	}
	run >| list.tsv
}
Run "$@"
