import type { FixedColumnID, SourceID } from "@shared/types"
import { hottestDefaultExcluded } from "@shared/metadata"
import type { Update } from "./types"

export const focusSourcesAtom = atom((get) => {
  return get(primitiveMetadataAtom).data.focus
}, (get, set, update: Update<SourceID[]>) => {
  const _ = update instanceof Function ? update(get(focusSourcesAtom)) : update
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: {
      ...get(primitiveMetadataAtom).data,
      focus: _,
    },
  })
})

export const currentColumnIDAtom = atom<FixedColumnID>("focus")

export const currentSourcesAtom = atom((get) => {
  const id = get(currentColumnIDAtom)
  const items = get(primitiveMetadataAtom).data[id]
  if (id === "hottest") {
    return items.filter(sourceId => !hottestDefaultExcluded.has(sourceId))
  }
  return items
}, (get, set, update: Update<SourceID[]>) => {
  const id = get(currentColumnIDAtom)
  const _ = update instanceof Function ? update(get(currentSourcesAtom)) : update
  const nextItems = id === "hottest"
    ? _.filter(sourceId => !hottestDefaultExcluded.has(sourceId))
    : _
  set(primitiveMetadataAtom, {
    updatedTime: Date.now(),
    action: "manual",
    data: {
      ...get(primitiveMetadataAtom).data,
      [id]: nextItems,
    },
  })
})

export const goToTopAtom = atom({
  ok: false,
  el: undefined as HTMLElement | undefined,
  fn: undefined as (() => void) | undefined,
})
