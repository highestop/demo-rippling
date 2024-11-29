import { computed, createStore, effect, state, State, Computed } from ".."
import { ReadableAtom } from "../typing/atom"
import { atom, createStore as createJotaiStore, Atom as JotaiAtom, PrimitiveAtom } from 'jotai/vanilla'

function mergeRipplingStates(atoms: ReadableAtom<number>[], childCount: number): Computed<number> {
    let pendingAtoms: ReadableAtom<number>[] = [...atoms]
    while (pendingAtoms.length > 1) {
        const derivedAtoms: ReadableAtom<number>[] = []
        for (let i = 0; i < pendingAtoms.length / childCount; i++) {
            const innerAtoms: ReadableAtom<number>[] = []
            for (let j = 0; j < childCount && i * childCount + j < pendingAtoms.length; j++) {
                innerAtoms.push(pendingAtoms[i * childCount + j])
            }
            const derived = computed((get) => {
                let total = 0
                for (const atom of innerAtoms) {
                    total += get(atom)
                }
                return total
            })
            derivedAtoms.push(derived)
        }
        pendingAtoms = derivedAtoms
    }
    return pendingAtoms[0] as Computed<number>
}

function mergeJotaiAtoms(atoms: JotaiAtom<number>[], childCount: number): JotaiAtom<number> {
    let pendingAtoms: JotaiAtom<number>[] = [...atoms]
    while (pendingAtoms.length > 1) {
        const derivedAtoms: JotaiAtom<number>[] = []
        for (let i = 0; i < pendingAtoms.length / childCount; i++) {
            const innerAtoms: JotaiAtom<number>[] = []
            for (let j = 0; j < childCount && i * childCount + j < pendingAtoms.length; j++) {
                innerAtoms.push(pendingAtoms[i * childCount + j])
            }
            const derived = atom((get) => {
                let total = 0
                for (const atom of innerAtoms) {
                    total += get(atom)
                }
                return total
            })
            derivedAtoms.push(derived)
        }
        pendingAtoms = derivedAtoms
    }

    return pendingAtoms[0]
}

function setupRipplingStore(scale = 5) {
    const store = createStore()
    const atoms: ReadableAtom<number>[] = []
    for (let i = 0; i < Math.pow(10, scale); i++) {
        atoms.push(state(i))
    }

    const topAtom = mergeRipplingStates(atoms, 10)

    return { store, atoms, topAtom }
}

export function setupRipplingSetCase(scale = 5) {
    const { store, atoms, topAtom } = setupRipplingStore(scale)

    const cleanup = store.sub(topAtom, effect((get) => {
        get(topAtom)
    }))

    const update = () => {
        store.set(atoms[0] as State<number>, (x) => x + 1)
        store.notify()
    }

    return {
        cleanup,
        update,
    }
}

export function setupRipplingSetCaseWithoutNotify(scale = 5) {
    const { store, atoms, topAtom } = setupRipplingStore(scale)

    const cleanup = store.sub(topAtom, effect((get) => {
        get(topAtom)
    }))

    const update = () => {
        store.set(atoms[0] as State<number>, (x) => x + 1)
    }

    return {
        cleanup,
        update,
    }
}

function setupJotaiStore(scale = 5) {
    const store = createJotaiStore()
    const atoms: PrimitiveAtom<number>[] = []
    for (let i = 0; i < Math.pow(10, scale); i++) {
        atoms.push(atom(i))
    }

    const topAtom = mergeJotaiAtoms(atoms, 10)
    return { store, atoms, topAtom }
}

export function setupJotaiSetCase(scale = 5) {
    const { store, atoms, topAtom } = setupJotaiStore(scale)

    const cleanup = store.sub(topAtom, () => {
        store.get(topAtom)
    })

    const update = () => {
        store.set(atoms[0], (x: number) => x + 1)
    }

    return {
        cleanup,
        update,
    }
}

export function setupRipplingSetCaseWithoutMount(scale = 5) {
    const { store, atoms, topAtom } = setupRipplingStore(scale)

    const cleanup = () => void (0)
    const update = () => {
        store.set(atoms[0] as State<number>, (x) => x + 1)
        store.get(topAtom)
    }

    return {
        cleanup,
        update,
    }
}
export function setupJotaiSetCaseWithoutMount(scale = 5) {
    const { store, atoms, topAtom } = setupJotaiStore(scale)

    const cleanup = () => void (0)
    const update = () => {
        store.set(atoms[0], (x: number) => x + 1)
        store.get(topAtom)
    }

    return {
        cleanup,
        update,
    }
}