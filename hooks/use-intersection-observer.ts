import { useEffect, useRef, useState } from "react"

interface UseIntersectionObserverOptions {
    threshold?: number | number[]
    root?: Element | null
    rootMargin?: string
    freezeOnceVisible?: boolean
}

export function useIntersectionObserver<T extends Element>(
    options: UseIntersectionObserverOptions = {}
): [React.RefObject<T | null>, boolean] {
    const {
        threshold = 0,
        root = null,
        rootMargin = "200px", // Load 200px before element is visible
        freezeOnceVisible = false,
    } = options

    const elementRef = useRef<T>(null)
    const [isIntersecting, setIsIntersecting] = useState(false)

    useEffect(() => {
        const element = elementRef.current
        if (!element) return

        // If already visible and frozen, don't observe
        if (freezeOnceVisible && isIntersecting) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                const isElementIntersecting = entry.isIntersecting

                setIsIntersecting(isElementIntersecting)

                // Unobserve if frozen once visible
                if (freezeOnceVisible && isElementIntersecting) {
                    observer.unobserve(element)
                }
            },
            { threshold, root, rootMargin }
        )

        observer.observe(element)

        return () => {
            observer.disconnect()
        }
    }, [threshold, root, rootMargin, freezeOnceVisible, isIntersecting])

    return [elementRef, isIntersecting]
}
