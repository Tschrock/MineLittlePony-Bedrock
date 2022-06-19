export interface Person {
    name: string
    email?: string
    url?: string
}

export interface Package {
    name: string
    version?: string
    homepage?: string
    license?: string
    author?: string | Person
    contributors?: Array<string | Person>
    engines?: Record<string, string>
}

export interface ManifestHeader {
    name?: string
    description?: string
    uuid: string
    version: [number, number, number]
    min_engine_version?: [number, number, number]
}

export interface ManifestModule {
    description?: string
    type?: string
    uuid?: string
    version?: [number, number, number]
}

export interface ManifestMetadata {
    authors?: string[]
    license?: string
    url?: string
}

export interface ManifestDependency {
    version: [number, number, number]
    uuid: string
}

export interface Manifest {
    format_version?: number
    header?: ManifestHeader
    modules?: ManifestModule[]
    metadata?: ManifestMetadata
    dependencies?: ManifestDependency[]
}
