# Latest Sprint 1 Recovery V2 Failure

- Run ID: 30169958597
- Run URL: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30169958597
- Prepare: success
- Backup: success
- Receipt: failure
- Integrate: skipped
- Environment: skipped
- Install/Prisma: skipped
- Six checks: skipped
- Integration push: skipped
- QA branch: skipped

## Diagnostic tails

### docker-copy.log
```text
```

### docker-inspect.log
```text
                "PGDATA=/var/lib/postgresql/data"
            ],
            "Cmd": [
                "postgres"
            ],
            "Healthcheck": {
                "Test": [
                    "CMD-SHELL",
                    "pg_isready -U prij_clinic_dev -d prij_clinic_dev"
                ],
                "Interval": 10000000000,
                "Timeout": 5000000000,
                "Retries": 5
            },
            "Image": "postgres:16-alpine",
            "Volumes": {
                "/var/lib/postgresql/data": {}
            },
            "WorkingDir": "/",
            "Entrypoint": [
                "docker-entrypoint.sh"
            ],
            "Labels": {
                "com.docker.compose.config-hash": "28d9a8c25d27dc35c1713685ae0e51080ac9c3ac8f922d7f48db4d700713a9d6",
                "com.docker.compose.container-number": "1",
                "com.docker.compose.depends_on": "",
                "com.docker.compose.image": "sha256:e013e867e712fec275706a6c51c966f0bb0c93cfa8f51000f85a15f9865a28cb",
                "com.docker.compose.oneoff": "False",
                "com.docker.compose.project": "prij-clinic",
                "com.docker.compose.project.config_files": "C:\\Users\\SuperUser\\Desktop\\prij-clinic\\docker-compose.yml",
                "com.docker.compose.project.working_dir": "C:\\Users\\SuperUser\\Desktop\\prij-clinic",
                "com.docker.compose.service": "postgres",
                "com.docker.compose.version": "5.1.4"
            },
            "StopSignal": "SIGINT",
            "StopTimeout": 1
        },
        "NetworkSettings": {
            "SandboxID": "24898a7c0869f2fdbe450c6e72e19b62121603527713a7528ce3270b5ec33333",
            "SandboxKey": "/var/run/docker/netns/24898a7c0869",
            "Ports": {
                "5432/tcp": [
                    {
                        "HostIp": "0.0.0.0",
                        "HostPort": "5432"
                    },
                    {
                        "HostIp": "::",
                        "HostPort": "5432"
                    }
                ]
            },
            "Networks": {
                "prij-clinic_default": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": [
                        "prij-clinic-postgres",
                        "postgres"
                    ],
                    "DriverOpts": null,
                    "GwPriority": 0,
                    "NetworkID": "2f2cab1d977866a2217904282e7f913014f2854a57784e38149ccd24337438f6",
                    "EndpointID": "b789f55f370c2298df98d44aff57dae2faa7009221cdf439489c5116ca92f9af",
                    "Gateway": "172.18.0.1",
                    "IPAddress": "172.18.0.2",
                    "MacAddress": "26:cc:7e:68:66:3d",
                    "IPPrefixLen": 16,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "DNSNames": [
                        "prij-clinic-postgres",
                        "postgres",
                        "0d4f398d72a8"
                    ]
                }
            }
        },
        "ImageManifestDescriptor": {
            "mediaType": "application/vnd.oci.image.manifest.v1+json",
            "digest": "sha256:0fc5c901ec0a3c55ce70b99b040daeb89d5b35b61febbced1b4b24dbc3153ec8",
            "size": 3054,
            "annotations": {
                "com.docker.official-images.bashbrew.arch": "amd64",
                "org.opencontainers.image.base.digest": "sha256:79ff19e9084a00eece421b2523fb93e22d730e2c0e525905de047e848e56d95f",
                "org.opencontainers.image.base.name": "alpine:3.24",
                "org.opencontainers.image.created": "2026-06-16T22:58:05Z",
                "org.opencontainers.image.revision": "b6a26b9672dcce87fdcc185b902650129c90a6c4",
                "org.opencontainers.image.source": "https://github.com/docker-library/postgres.git#b6a26b9672dcce87fdcc185b902650129c90a6c4:16/alpine3.24",
                "org.opencontainers.image.url": "https://hub.docker.com/_/postgres",
                "org.opencontainers.image.version": "16.14-alpine3.24"
            },
            "platform": {
                "architecture": "amd64",
                "os": "linux"
            }
        }
    }
]
```

### pg-dump.log
```text
```
