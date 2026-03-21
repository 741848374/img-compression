export function splitUint8Array(data, separator) {
  const result = [];
  const sepLen = separator.length;
  const dataLen = data.length;
  let start = 0;

  for (let i = 0; i <= dataLen - sepLen; i++) {
    if (data[i] !== separator[0]) continue;

    // 完整匹配分隔符
    let match = true;
    for (let j = 1; j < sepLen; j++) {
      if (data[i + j] !== separator[j]) {
        match = false;
        break;
      }
    }

    if (match) {
      // 切割图片
      result.push(data.slice(start, i));
      // 移动指针
      start = i + sepLen;
      // 跳过已匹配部分
      i = start - 1;
    }
  }

  if (start < dataLen) {
    result.push(data.slice(start));
  }

  return result;
}
