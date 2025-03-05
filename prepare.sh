#!/usr/bin/env bash

version=$1

# 替换 -alpha 为空字符串
metadata=${version//-alpha/}
dot_count=$(grep -o "\." <<< "$metadata" | wc -l)

if [[ "$dot_count" -eq 2 ]]; then
    metadata="${metadata}.9999"
fi

# manifest 版本
export EXTENSION_RELEASE_VERSION=$metadata

# 原始版本，用于文件名
export EXTENSION_VERSION=$version

npm run build
