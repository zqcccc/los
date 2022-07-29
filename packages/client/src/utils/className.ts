const c = (...classNames: (unknown | Record<string, boolean>)[]) => {
  return classNames
    .reduce<string[]>((arr, cur) => {
      if (typeof cur === 'string') {
        arr.push(cur.trim())
      } else if (typeof cur === 'object' && cur !== null) {
        const keys = Object.keys(cur) as Array<keyof typeof cur>
        keys.forEach((key) => {
          if (cur[key]) arr.push(key)
        })
      } else if (Array.isArray(cur)) {
        arr.push(c(cur))
      }
      return arr
    }, [])
    .join(' ')
}

export default c
