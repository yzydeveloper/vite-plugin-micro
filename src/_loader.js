async function __loadMetadata(remotes) {
    const importmap = {
        imports: {},
        scopes: {}
    }
    const importmapScript = document.createElement('script')
    importmapScript.type = 'importmap'

    // load metadata
    const metadataSet = await Promise.all(Object.entries(remotes).map(([remoteName, remote]) => {
        const remoteUrl = remote.endsWith('/') ? remote : `${remote}/`
        const metadataUrl = `${remoteUrl}metadata.json`
        return fetch(metadataUrl)
            .then(res => res.json())
            .then(res => {
                for (const key in res) {
                    if (Object.prototype.hasOwnProperty.call(res, key)) {
                        res[key] = `${remoteUrl}${res[key]}`
                    }
                }
                return res
            }).catch(error =>{
                console.error(`Error loading remote metadata for ${remoteName}: ${error.message}`)
            })
    }))

    // make importmap
    importmap.imports = metadataSet.reduce((result, md) => ({ ...result, ...md }), importmap.imports)

    importmapScript.innerHTML = JSON.stringify(importmap)
    document.head.appendChild(importmapScript)

    // load remote entry
    await Promise.all(Object.entries(remotes).map(([remoteName, remote]) => {
        const remoteUrl = remote.endsWith('/') ? remote : `${remote}/`
        return import(`${remoteUrl}remote-entry.js`)
            .catch(error => {
                console.error(`Error loading remote entry for ${remoteName}: ${error.message}`)
            })
    }))

    const preload = [].slice.call(document.querySelectorAll('link[rel="modulepreload-shim"]'))
    preload.forEach((item) => {
        item.rel = 'modulepreload'
    })

    const mainModule = document.querySelector('script[type="module-shim"]')
    if(mainModule) {
        mainModule.type = 'module'
        import(mainModule.src)
    }
};
__loadMetadata(_remotes);
