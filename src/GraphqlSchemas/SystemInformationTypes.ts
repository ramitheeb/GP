import { gql } from "apollo-server-express";

const allTypes = gql`
  scalar JSON
  scalar JSONObject

  type Alert {
    start: Float!
    end: Float!
    rangeName: String!
    metric: String!
    alertName: String!
    id: Float!
  }

  type CommandChain {
    id: Float!
    chainName: String!
    scriptFileLocation: String!
    arguments: [String]
    chain: String
  }
  type User {
    id: ID!
    username: String!
    email: String!
    created: String!
    token: String!
  }

  input RegisterUserInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }

  type TimeData {
    current: String
    uptime: String
    timezone: String
    timezoneName: String
  }

  type RaspberryRevisionData {
    manufacturer: String
    processor: String
    type: String
    revision: String
  }

  type SystemData {
    manufacturer: String
    model: String
    version: String
    serial: String
    uuid: String
    sku: String
    virtual: Boolean
    virtualHost: String
    raspberry: RaspberryRevisionData
  }

  type BiosData {
    vendor: String
    version: String
    releaseDate: String
    revision: String
    language: String
    features: [String]
  }

  type BaseboardData {
    manufacturer: String
    model: String
    version: String
    serial: String
    assetTag: String
  }

  type ChassisData {
    manufacturer: String
    model: String
    type: String
    version: String
    serial: String
    assetTag: String
    sku: String
  }

  type CpuData {
    manufacturer: String
    brand: String
    vendor: String
    family: String
    model: String
    stepping: String
    revision: String
    voltage: String
    speed: Float
    speedMin: Float
    speedMax: Float
    governor: String
    cores: Float
    physicalCores: Float
    efficiencyCores: Float
    performanceCores: Float
    processors: Float
    socket: String
    flags: String
    virtualization: Boolean
    cache: CpuCacheData
  }

  type CpuCacheData {
    l1d: Float
    l1i: Float
    l2: Float
    l3: Float
  }

  type CpuCurrentSpeedData {
    min: Float
    max: Float
    avg: Float
    cores: [Float]
  }

  type CpuTemperatureData {
    main: Float
    cores: [Float]
    max: Float
  }

  type MemData {
    total: Float
    free: Float
    used: Float
    active: Float
    available: Float
    buffcache: Float
    buffers: Float
    cached: Float
    slab: Float
    swaptotal: Float
    swapused: Float
    swapfree: Float
    timestamp: Float
  }

  type MemLayoutData {
    size: Float
    bank: String
    type: String
    ecc: Boolean
    clockSpeed: Float
    formFactor: String
    partNum: String
    serialNum: String
    voltageConfigured: Float
    voltageMin: Float
    voltageMax: Float
  }

  type DiskLayoutData {
    device: String
    type: String
    name: String
    vendor: String
    size: Float
    bytesPerSector: Float
    totalCylinders: Float
    totalHeads: Float
    totalSectors: Float
    totalTracks: Float
    tracksPerCylinder: Float
    sectorsPerTrack: Float
    firmwareRevision: String
    serialNum: String
    interfaceType: String
    smartStatus: String
  }

  type BatteryData {
    hasBattery: Boolean
    cycleCount: Float
    isCharging: Boolean
    voltage: Float
    designedCapacity: Float
    maxCapacity: Float
    currentCapacity: Float
    capacityUnit: String
    percent: Float
    timeRemaining: Float
    acConnected: Boolean
    type: String
    model: String
    manufacturer: String
    serial: String
  }

  type GraphicsData {
    controllers: [GraphicsControllerData]
    displays: [GraphicsDisplayData]
  }

  type GraphicsControllerData {
    vendor: String
    model: String
    bus: String
    busAddress: String
    vram: Float
    vramDynamic: Boolean
    subDeviceId: String
    driverVersion: String
    name: String
    pciBus: String
    fanSpeed: Float
    memoryTotal: Float
    memoryUsed: Float
    memoryFree: Float
    utilizationGpu: Float
    utilizationMemory: Float
    temperatureGpu: Float
    temperatureMemory: Float
    powerDraw: Float
    powerLimit: Float
    clockCore: Float
    clockMemory: Float
  }

  type GraphicsDisplayData {
    vendor: String
    model: String
    deviceName: String
    main: Boolean
    builtin: Boolean
    connection: String
    sizeX: Float
    sizeY: Float
    pixelDepth: Float
    resolutionX: Float
    resolutionY: Float
    currentResX: Float
    currentResY: Float
    positionX: Float
    positionY: Float
    currentRefreshRate: Float
  }

  type OsData {
    platform: String
    distro: String
    release: String
    codename: String
    kernel: String
    arch: String
    hostname: String
    fqdn: String
    codepage: String
    logofile: String
    serial: String
    build: String
    servicepack: String
    uefi: Boolean
    hypervizor: Boolean
    remoteSession: Boolean
  }

  type UuidData {
    os: String
    hardware: String
  }

  type VersionData {
    kernel: String
    openssl: String
    systemOpenssl: String
    systemOpensslLib: String
    node: String
    v8: String
    npm: String
    yarn: String
    pm2: String
    gulp: String
    grunt: String
    git: String
    tsc: String
    mysql: String
    redis: String
    mongodb: String
    nginx: String
    php: String
    docker: String
    postfix: String
    postgresql: String
    perl: String
    python: String
    python3: String
    pip: String
    pip3: String
    java: String
    gcc: String
    virtualbox: String
    dotnet: String
  }

  type UserData {
    user: String
    tty: String
    date: String
    time: String
    ip: String
    command: String
  }

  type FsSizeData {
    fs: String
    type: String
    size: Float
    used: Float
    available: Float
    use: Float
    mount: String
  }

  type FsOpenFilesData {
    max: Float
    allocated: Float
    available: Float
  }

  type BlockDevicesData {
    name: String
    identifier: String
    type: String
    fsType: String
    mount: String
    size: Float
    physical: String
    uuid: String
    label: String
    model: String
    serial: String
    removable: Boolean
    protocol: String
  }

  type FsStatsData {
    rx: Float
    wx: Float
    tx: Float
    rx_sec: Float
    wx_sec: Float
    tx_sec: Float
    ms: Float
  }

  type DisksIoData {
    rIO: Float
    wIO: Float
    tIO: Float
    rIO_sec: Float
    wIO_sec: Float
    tIO_sec: Float
    ms: Float
    timestamp: Float
  }

  type NetworkInterfacesData {
    iface: String
    ifaceName: String
    ip4: String
    ip4subnet: String
    ip6: String
    ip6subnet: String
    mac: String
    internal: Boolean
    virtual: Boolean
    operstate: String
    type: String
    duplex: String
    mtu: Float
    speed: Float
    dhcp: Boolean
    dnsSuffix: String
    ieee8021xAuth: String
    ieee8021xState: String
    carrierChanges: Float
  }

  type NetworkStatsData {
    iface: String
    operstate: String
    rx_bytes: Float
    rx_dropped: Float
    rx_errors: Float
    tx_bytes: Float
    tx_dropped: Float
    tx_errors: Float
    rx_sec: Float
    tx_sec: Float
    ms: Float
  }

  type NetworkConnectionsData {
    protocol: String
    localAddress: String
    localPort: String
    peerAddress: String
    peerPort: String
    state: String
    pid: Float
    process: String
  }

  type InetChecksiteData {
    url: String
    ok: Boolean
    status: Float
    ms: Float
  }

  type WifiNetworkData {
    ssid: String
    bssid: String
    mode: String
    channel: Float
    frequency: Float
    signalLevel: Float
    quality: Float
    security: [String]
    wpaFlags: [String]
    rsnFlags: [String]
  }

  type WifiInterfaceData {
    id: String
    iface: String
    model: String
    vendor: String
  }

  type WifiConnectionData {
    id: String
    iface: String
    model: String
    ssid: String
    bssid: String
    channel: Float
    type: String
    security: String
    frequency: Float
    signalLevel: Float
    txRate: Float
  }

  type CurrentLoadData {
    avgLoad: Float
    currentLoad: Float
    currentLoadUser: Float
    currentLoadSystem: Float
    currentLoadNice: Float
    currentLoadIdle: Float
    currentLoadIrq: Float
    rawCurrentLoad: Float
    rawCurrentLoadUser: Float
    rawCurrentLoadSystem: Float
    rawCurrentLoadNice: Float
    rawCurrentLoadIdle: Float
    rawCurrentLoadIrq: Float
    cpus: [CurrentLoadCpuData]
    timestamp: Float
  }

  type CurrentLoadCpuData {
    load: Float
    loadUser: Float
    loadSystem: Float
    loadNice: Float
    loadIdle: Float
    loadIrq: Float
    rawLoad: Float
    rawLoadUser: Float
    rawLoadSystem: Float
    rawLoadNice: Float
    rawLoadIdle: Float
    rawLoadIrq: Float
  }

  type ProcessesData {
    all: Float
    running: Float
    blocked: Float
    sleeping: Float
    unknown: Float
    list: [ProcessesProcessData]
  }

  type ProcessesProcessData {
    pid: Float
    parentPid: Float
    name: String
    cpu: Float
    cpuu: Float
    cpus: Float
    mem: Float
    priority: Float
    memVsz: Float
    memRss: Float
    nice: Float
    started: String
    state: String
    tty: String
    user: String
    command: String
    params: String
    path: String
  }

  type ProcessesProcessLoadData {
    proc: String
    pid: Float
    pids: [Float]
    cpu: Float
    mem: Float
  }

  type ServicesData {
    name: String
    running: Boolean
    startmode: String
    pids: [Float]
    cpu: Float
    mem: Float
  }

  type DockerInfoData {
    id: String
    containers: Float
    containersRunning: Float
    containersPaused: Float
    containersStopped: Float
    images: Float
    driver: String
    memoryLimit: Boolean
    swapLimit: Boolean
    kernelMemory: Boolean
    cpuCfsPeriod: Boolean
    cpuCfsQuota: Boolean
    cpuShares: Boolean
    cpuSet: Boolean
    ipv4Forwarding: Boolean
    bridgeNfIptables: Boolean
    bridgeNfIp6tables: Boolean
    debug: Boolean
    mfd: Float
    oomKillDisable: Boolean
    ngoroutines: Float
    systemTime: String
    loggingDriver: String
    cgroupDriver: String
    nEventsListener: Float
    kernelVersion: String
    operatingSystem: String
    osType: String
    architecture: String
    ncpu: Float
    memTotal: Float
    dockerRootDir: String
    httpProxy: String
    httpsProxy: String
    noProxy: String
    name: String
    labels: [String]
    experimentalBuild: Boolean
    serverVersion: String
    clusterStore: String
    clusterAdvertise: String
    defaultRuntime: String
    liveRestoreEnabled: Boolean
    isolation: String
    initBinary: String
    productLicense: String
  }

  type DockerContainerData {
    id: String
    name: String
    image: String
    imageID: String
    command: String
    created: Float
    started: Float
    finished: Float
    createdAt: String
    startedAt: String
    finishedAt: String
    state: String
    restartCount: Float
    platform: String
    driver: String
    ports: [Float]
    mounts: [DockerContainerMountData]
  }

  type DockerContainerMountData {
    Type: String
    Source: String
    Destination: String
    Mode: String
    RW: Boolean
    Propagation: String
  }

  type netIODate {
    rx: Float
    wx: Float
  }
  type blockIOData {
    r: Float
    w: Float
  }
  type DockerContainerStatsData {
    id: String
    memUsage: Float
    memLimit: Float
    memPercent: Float
    cpuPercent: Float
    netIO: netIODate
    blockIO: blockIOData
    restartCount: Float
    cpuStats: JSONObject
    precpuStats: JSONObject
    memoryStats: JSONObject
    networks: JSONObject
    timestamp: Float
  }

  type DockerImageData {
    id: String
    container: String
    comment: String
    os: String
    architecture: String
    parent: String
    dockerVersion: String
    size: Float
    sharedSize: Float
    virtualSize: Float
    author: String
    created: Float
    containerConfig: JSONObject
    graphDriver: JSONObject
    repoDigests: [String]
    repoTags: [String]
    config: JSONObject
    rootFS: JSONObject
  }

  type VboxInfoData {
    id: String
    name: String
    running: Boolean
    started: String
    runningSince: Float
    stopped: String
    stoppedSince: Float
    guestOS: String
    hardwareUUID: String
    memory: Float
    vram: Float
    cpus: Float
    cpuExepCap: String
    cpuProfile: String
    chipset: String
    firmware: String
    pageFusion: Boolean
    configFile: String
    snapshotFolder: String
    logFolder: String
    hpet: Boolean
    pae: Boolean
    longMode: Boolean
    tripleFaultReset: Boolean
    apic: Boolean
    x2Apic: Boolean
    acpi: Boolean
    ioApic: Boolean
    biosApicMode: String
    bootMenuMode: String
    bootDevice1: String
    bootDevice2: String
    bootDevice3: String
    bootDevice4: String
    timeOffset: String
    rtc: String
  }

  type PrinterData {
    id: Float
    name: String
    model: String
    uri: String
    uuid: String
    local: Boolean
    status: String
    default: Boolean
    shared: Boolean
  }

  type UsbData {
    id: String
    bus: Float
    deviceId: Float
    name: String
    type: String
    removable: Boolean
    vendor: String
    manufacturer: String
    maxPower: String
    serialNumber: String
  }

  type AudioData {
    id: String
    name: String
    manufacturer: String
    default: Boolean
    revision: String
    driver: String
    in: Boolean
    out: Boolean
    interfaceType: String
    status: String
  }

  type BluetoothDeviceData {
    device: String
    name: String
    macDevice: String
    macHost: String
    batteryPercent: Float
    manufacturer: String
    type: String
    connected: Boolean
  }

  type StaticData {
    version: String
    system: SystemData
    bios: BiosData
    baseboard: BaseboardData
    chassis: ChassisData
    os: OsData
    uuid: UuidData
    versions: VersionData
    cpu: CpuData
    graphics: GraphicsData
    net: [NetworkInterfacesData]
    memLayout: [MemLayoutData]
    diskLayout: [DiskLayoutData]
  }

  type TrafficData {
    traffic: Float
    timestamp: Float
  }

  type EndpointStatistics {
    endpoint: String
    requestCount: Int
  }

  type DemographicGeoStatistics {
    country: String
    requestCount: Int
  }
`;

export default allTypes;
