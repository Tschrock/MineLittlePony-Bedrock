export interface Person {
    name: string
    email?: string
    url?: string
}

export interface Package {
    name: string
    version: string
    homepage: string
    license: string
    author: string | Person
    contributors: Array<string | Person>
}

export interface Manifest {
    header?: {
        name?: string
        description?: string
        version?: [number, number, number]
    }
    modules?: Array<{
        description?: string
        version?: [number, number, number]
    }>
    metadata?: {
        authors?: string[]
        license?: string
        url?: string
    }
}
