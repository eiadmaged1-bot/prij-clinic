# Latest QA Pregnancy EDD Pure Verify Run

- Run ID: `30177291252`
- Status: `completed`
- Conclusion: `failure`
- Head SHA: `dc2515b3104fefe9545a240fef983ed11b1f37bb`
- URL: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30177291252

## Run summary
```text

X security/rbac-scope-enforcement Prij QA Pregnancy EDD Pure Verify · 30177291252
Triggered via push about 2 minutes ago

JOBS
X patch-verify in 1m11s (ID 89728029836)
  ✓ Set up job
  ✓ Checkout deterministic controls
  ✓ Checkout QA repair branch
  ✓ Setup Node 22
  ✓ Apply guarded pregnancy and EDD UI patch
  ✓ Install dependencies
  ✓ Run locked pregnancy and EDD contract
  ✓ Run Feature 46 regression
  X Run typecheck
  - Run production build
  - Commit verified pure implementation
  - Post Setup Node 22
  ✓ Post Checkout QA repair branch
  ✓ Post Checkout deterministic controls
  ✓ Complete job

ANNOTATIONS
requesting annotations returned 403 Forbidden as the token does not have sufficient permissions. Note that it is not currently possible to create a fine-grained PAT with the `checks:read` permission.

To see what failed, try: gh run view 30177291252 --log-failed
View this run on GitHub: https://github.com/eiadmaged1-bot/prij-clinic/actions/runs/30177291252
```

## Failed log tail
```text
patch-verify	Run typecheck	2026-07-25T22:18:35.0432708Z ##[error]src/pregnancy/dto.ts(2,30): error TS2305: Module '"@prisma/client"' has no exported member 'PregnancyStatus'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0443905Z ##[error]src/pregnancy/pregnancy.service.ts(28,53): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0446442Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0449877Z ##[error]src/pregnancy/pregnancy.service.ts(111,24): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'PregnancyUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0467478Z ##[error]src/pregnancy/pregnancy.service.ts(143,53): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0470265Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0493240Z ##[error]src/pregnancy/pregnancy.service.ts(144,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0496133Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0498593Z ##[error]src/pregnancy/pregnancy.service.ts(301,59): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0502103Z ##[error]src/pregnancy/pregnancy.service.ts(354,53): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0505164Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0507847Z ##[error]src/pregnancy/pregnancy.service.ts(355,57): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0510839Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0533829Z ##[error]src/pregnancy/pregnancy.service.ts(357,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0536797Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0540706Z ##[error]src/pregnancy/pregnancy.service.ts(379,72): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0546361Z ##[error]src/pregnancy/pregnancy.service.ts(438,28): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0551770Z ##[error]src/pregnancy/pregnancy.service.ts(439,31): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundGetPayload'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0576222Z ##[error]src/pregnancy/pregnancy.service.ts(443,45): error TS7006: Parameter 'scan' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.0580661Z ##[error]src/pregnancy/pregnancy.service.ts(467,189): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0584932Z ##[error]src/pregnancy/pregnancy.service.ts(498,37): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0587760Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0590509Z ##[error]src/pregnancy/pregnancy.service.ts(499,57): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0613602Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0616442Z ##[error]src/pregnancy/pregnancy.service.ts(501,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0696354Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0700436Z ##[error]src/pregnancy/pregnancy.service.ts(507,24): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0726771Z ##[error]src/pregnancy/pregnancy.service.ts(519,60): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0732187Z ##[error]src/pregnancy/pregnancy.service.ts(520,53): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0737579Z ##[error]src/pregnancy/pregnancy.service.ts(521,67): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0742505Z ##[error]src/pregnancy/pregnancy.service.ts(521,127): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0768039Z ##[error]src/pregnancy/pregnancy.service.ts(521,207): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0773919Z ##[error]src/pregnancy/pregnancy.service.ts(522,59): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0779183Z ##[error]src/pregnancy/pregnancy.service.ts(526,23): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0802019Z ##[error]src/pregnancy/pregnancy.service.ts(527,23): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0806587Z ##[error]src/pregnancy/pregnancy.service.ts(664,33): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0809482Z ##[error]src/pregnancy/pregnancy.service.ts(664,66): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0814238Z ##[error]src/pregnancy/pregnancy.service.ts(700,20): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'PregnancyInclude'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0819593Z ##[error]src/pregnancy/pregnancy.service.ts(705,20): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'PreviousPregnancyInclude'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0825119Z ##[error]src/pregnancy/pregnancy.service.ts(716,20): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ObUltrasoundInclude'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0828858Z ##[error]src/pregnancy/pregnancy.service.ts(738,50): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0856447Z ##[error]src/pregnancy/pregnancy.service.ts(741,153): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0861447Z ##[error]src/pregnancy/pregnancy.service.ts(741,182): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0866531Z ##[error]src/pregnancy/pregnancy.service.ts(741,211): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0872553Z ##[error]src/pregnancy/pregnancy.service.ts(741,240): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0898000Z ##[error]src/pregnancy/pregnancy.service.ts(754,270): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0903288Z ##[error]src/pregnancy/pregnancy.service.ts(754,299): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0908281Z ##[error]src/pregnancy/pregnancy.service.ts(754,328): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0933408Z ##[error]src/pregnancy/pregnancy.service.ts(754,357): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'Decimal'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0937994Z ##[error]src/prescriptions/prescriptions.service.ts(21,37): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0939643Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0941698Z ##[error]src/prescriptions/prescriptions.service.ts(22,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0943914Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.0947823Z ##[error]src/prescriptions/prescriptions.service.ts(189,51): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0953522Z ##[error]src/prescriptions/prescriptions.service.ts(218,51): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0959234Z ##[error]src/prescriptions/prescriptions.service.ts(242,49): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0963828Z ##[error]src/prescriptions/prescriptions.service.ts(308,33): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0966950Z ##[error]src/prescriptions/prescriptions.service.ts(308,66): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0971399Z ##[error]src/prescriptions/prescriptions.service.ts(419,45): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0977169Z ##[error]src/prescriptions/prescriptions.service.ts(419,69): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'NullableJsonNullValueInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0980999Z ##[error]src/prescriptions/prescriptions.service.ts(420,57): error TS2339: Property 'JsonNull' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0985781Z ##[error]src/prescriptions/prescriptions.service.ts(420,85): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0991032Z ##[error]src/prisma/prisma.service.ts(5,56): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'PrismaClientOptions'.
patch-verify	Run typecheck	2026-07-25T22:18:35.0994714Z ##[error]src/prisma/prisma.service.ts(18,24): error TS7006: Parameter 'e' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.0997593Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(39,24): error TS7006: Parameter 'group' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1002171Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(47,25): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ClinicalProtocolWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1006335Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(64,79): error TS7006: Parameter 'protocol' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1010787Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(120,51): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1016320Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(159,77): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1022048Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(182,131): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1028558Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(194,142): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1034267Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(194,201): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1039702Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(205,162): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1045420Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(220,209): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1051027Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(230,164): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1055108Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(248,31): error TS7006: Parameter 'protocol' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1059993Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(264,117): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ClinicalProtocolWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1065794Z ##[error]src/protocol-atlas/protocol-atlas.service.ts(284,20): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ClinicalProtocolSelect'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1069620Z ##[error]src/queue/dto.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'QueuePriority'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1072420Z ##[error]src/queue/dto.ts(2,25): error TS2305: Module '"@prisma/client"' has no exported member 'VisitType'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1075266Z ##[error]src/queue/queue.service.ts(24,39): error TS7006: Parameter 'tx' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1077700Z ##[error]src/queue/queue.service.ts(48,60): error TS7006: Parameter 'tx' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1080716Z ##[error]src/queue/queue.service.ts(61,35): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1083496Z ##[error]src/queue/queue.service.ts(61,68): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1086406Z ##[error]src/queue/queue.service.ts(85,35): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1088964Z ##[error]src/queue/queue.service.ts(85,68): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1091885Z ##[error]src/queue/queue.service.ts(103,63): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1094863Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1097579Z ##[error]src/queue/queue.service.ts(190,35): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1100331Z ##[error]src/queue/queue.service.ts(190,68): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1103733Z ##[error]src/queue/queue.service.ts(193,35): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1106644Z ##[error]src/queue/queue.service.ts(193,68): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1110853Z ##[error]src/queue/queue.service.ts(239,140): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'QueueTicketWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1114502Z ##[error]src/queue/queue.service.ts(244,26): error TS7006: Parameter 'left' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1117105Z ##[error]src/queue/queue.service.ts(244,32): error TS7006: Parameter 'right' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1119602Z ##[error]src/queue/queue.service.ts(274,50): error TS7006: Parameter 'tx' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1123945Z ##[error]src/queue/queue.service.ts(281,33): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'QueueTicketWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1127928Z ##[error]src/queue/queue.service.ts(356,31): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1130848Z ##[error]src/queue/queue.service.ts(356,79): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1135295Z ##[error]src/queue/queue.service.ts(360,50): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'PrismaClientKnownRequestError'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1140292Z ##[error]src/rbac/rbac.service.ts(66,36): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'UserGetPayload'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1143824Z ##[error]src/rbac/rbac.service.ts(91,23): error TS7006: Parameter 'role' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1146565Z ##[error]src/rbac/rbac.service.ts(97,15): error TS7006: Parameter 'rolePermission' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1149195Z ##[error]src/rbac/rbac.service.ts(125,31): error TS7006: Parameter 'account' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1151780Z ##[error]src/rbac/rbac.service.ts(143,59): error TS7006: Parameter 'tx' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1155150Z ##[error]src/rbac/rbac.service.ts(170,35): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1157824Z ##[error]src/rbac/rbac.service.ts(170,68): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1160125Z ##[error]src/rbac/rbac.service.ts(171,38): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1162342Z ##[error]src/rbac/rbac.service.ts(171,60): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1164821Z ##[error]src/rbac/rbac.service.ts(171,99): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1167120Z ##[error]src/rbac/rbac.service.ts(208,59): error TS7006: Parameter 'tx' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1169588Z ##[error]src/rbac/rbac.service.ts(260,47): error TS7006: Parameter 'userRole' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1172000Z ##[error]src/rbac/rbac.service.ts(410,59): error TS7006: Parameter 'tx' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1176186Z ##[error]src/rbac/rbac.service.ts(524,35): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1180808Z ##[error]src/rbac/rbac.service.ts(528,35): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1184196Z ##[error]src/rbac/rbac.service.ts(873,34): error TS7006: Parameter 'userRole' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1186950Z ##[error]src/rbac/rbac.service.ts(917,44): error TS7006: Parameter 'userRole' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1189420Z ##[error]src/rbac/rbac.service.ts(929,14): error TS7006: Parameter 'override' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1191879Z ##[error]src/rbac/rbac.service.ts(930,11): error TS7006: Parameter 'override' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1194706Z ##[error]src/rbac/rbac.service.ts(933,14): error TS7006: Parameter 'override' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1197349Z ##[error]src/rbac/rbac.service.ts(934,11): error TS7006: Parameter 'override' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1200036Z ##[error]src/rbac/rbac.service.ts(983,21): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1204396Z ##[error]src/rbac/rbac.service.ts(986,45): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'JsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1209160Z ##[error]src/rbac/rbac.service.ts(1015,48): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'JsonValue'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1212719Z ##[error]src/reference/reference.service.ts(37,22): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1215567Z ##[error]src/reference/reference.service.ts(80,16): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1218130Z ##[error]src/reference/reference.service.ts(81,13): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1220705Z ##[error]src/reference/reference.service.ts(141,16): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1223611Z ##[error]src/reference/reference.service.ts(141,99): error TS7031: Binding element 'tag' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1226213Z ##[error]src/reference/reference.service.ts(141,255): error TS7031: Binding element 'tag' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1228837Z ##[error]src/reference/reference.service.ts(142,13): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1231507Z ##[error]src/reference/reference.service.ts(152,31): error TS7031: Binding element 'tag' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1234512Z ##[error]src/reference/reference.service.ts(156,16): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1237299Z ##[error]src/reference/reference.service.ts(157,13): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1240027Z ##[error]src/reference/reference.service.ts(159,16): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1242761Z ##[error]src/reference/reference.service.ts(160,13): error TS7006: Parameter 'row' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1245937Z ##[error]src/referrals/dto.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReferralDirection'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1248997Z ##[error]src/referrals/dto.ts(2,29): error TS2305: Module '"@prisma/client"' has no exported member 'ReferralStatus'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1251863Z ##[error]src/referrals/dto.ts(2,45): error TS2305: Module '"@prisma/client"' has no exported member 'ReferralType'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1255019Z ##[error]src/referrals/dto.ts(2,59): error TS2305: Module '"@prisma/client"' has no exported member 'ReferralUrgency'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1259447Z ##[error]src/referrals/referrals.service.ts(10,60): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ReferralInclude'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1263727Z ##[error]src/referrals/referrals.service.ts(21,37): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1266578Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1269557Z ##[error]src/referrals/referrals.service.ts(26,53): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1272394Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1275366Z ##[error]src/referrals/referrals.service.ts(27,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1278115Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1280746Z ##[error]src/referrals/referrals.service.ts(28,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1283817Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1286089Z ##[error]src/reports/dto.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReportCategory'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1289228Z ##[error]src/reports/dto.ts(2,26): error TS2305: Module '"@prisma/client"' has no exported member 'ReportStatus'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1292470Z ##[error]src/reports/reports.service.ts(22,53): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1295404Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1297949Z ##[error]src/reports/reports.service.ts(23,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1300574Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1303337Z ##[error]src/reports/reports.service.ts(27,48): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1306020Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1309620Z ##[error]src/reports/reports.service.ts(114,24): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ReportUpdateInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1313629Z ##[error]src/reports/reports.service.ts(165,33): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1316508Z ##[error]src/reports/reports.service.ts(165,66): error TS18046: 'error' is of type 'unknown'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1320699Z ##[error]src/reports/reports.service.ts(176,20): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'ReportInclude'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1326060Z ##[error]src/reports/reports.service.ts(182,130): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'PatientWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1329529Z ##[error]src/search/search.service.ts(57,14): error TS7006: Parameter 'patients' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1332203Z ##[error]src/search/search.service.ts(59,32): error TS7006: Parameter 'patient' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1335139Z ##[error]src/search/search.service.ts(99,27): error TS7006: Parameter 'item' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1337796Z ##[error]src/search/search.service.ts(100,26): error TS7006: Parameter 'item' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1340507Z ##[error]src/search/search.service.ts(121,14): error TS7006: Parameter 'items' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1343718Z ##[error]src/search/search.service.ts(123,29): error TS7006: Parameter 'item' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1346488Z ##[error]src/search/search.service.ts(146,14): error TS7006: Parameter 'requests' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1349227Z ##[error]src/search/search.service.ts(148,32): error TS7006: Parameter 'request' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1351881Z ##[error]src/search/search.service.ts(151,37): error TS7006: Parameter 'item' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1356865Z ##[error]src/search/search.service.ts(170,39): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'AppointmentWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1360455Z ##[error]src/search/search.service.ts(176,14): error TS7006: Parameter 'appointments' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1363498Z ##[error]src/search/search.service.ts(178,36): error TS7006: Parameter 'appointment' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1366240Z ##[error]src/search/search.service.ts(205,14): error TS7006: Parameter 'invoices' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1369118Z ##[error]src/search/search.service.ts(207,32): error TS7006: Parameter 'invoice' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1371704Z ##[error]src/search/search.service.ts(234,14): error TS7006: Parameter 'prescriptions' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1374674Z ##[error]src/search/search.service.ts(236,37): error TS7006: Parameter 'prescription' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1377369Z ##[error]src/search/search.service.ts(239,42): error TS7006: Parameter 'item' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1380209Z ##[error]src/search/search.service.ts(265,14): error TS7006: Parameter 'templates' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1383277Z ##[error]src/search/search.service.ts(267,33): error TS7006: Parameter 'template' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1386121Z ##[error]src/search/search.service.ts(288,14): error TS7006: Parameter 'documents' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1388869Z ##[error]src/search/search.service.ts(290,33): error TS7006: Parameter 'document' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1391553Z ##[error]src/search/search.service.ts(315,14): error TS7006: Parameter 'documents' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1394586Z ##[error]src/search/search.service.ts(317,33): error TS7006: Parameter 'document' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1398943Z ##[error]src/search/search.service.ts(355,130): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'PatientWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1402473Z ##[error]src/staff-chat/staff-chat.service.ts(26,32): error TS7006: Parameter 'staff' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1405521Z ##[error]src/staff-chat/staff-chat.service.ts(26,142): error TS7006: Parameter 'role' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1408438Z ##[error]src/staff-chat/staff-chat.service.ts(39,163): error TS7006: Parameter 'conversation' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1411261Z ##[error]src/staff-chat/staff-chat.service.ts(40,51): error TS7006: Parameter 'counts' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1414467Z ##[error]src/staff-chat/staff-chat.service.ts(40,59): error TS7006: Parameter 'receipt' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1417392Z ##[error]src/staff-chat/staff-chat.service.ts(41,48): error TS7006: Parameter 'conversation' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1420247Z ##[error]src/staff-chat/staff-chat.service.ts(96,38): error TS7006: Parameter 'message' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1423185Z ##[error]src/staff-chat/staff-chat.service.ts(105,59): error TS7006: Parameter 'tx' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1426209Z ##[error]src/staff-chat/staff-chat.service.ts(116,60): error TS7006: Parameter 'participant' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1429048Z ##[error]src/staff-chat/staff-chat.service.ts(119,33): error TS7006: Parameter 'participant' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1431725Z ##[error]src/staff-chat/staff-chat.service.ts(164,47): error TS7006: Parameter 'role' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1435256Z ##[error]src/staff-chat/staff-chat.service.ts(175,58): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1438017Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1440726Z ##[error]src/staff-chat/staff-chat.service.ts(176,66): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1443907Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1446947Z ##[error]src/staff-chat/staff-chat.service.ts(177,39): error TS2345: Argument of type 'PrismaService' is not assignable to parameter of type 'PrismaLike'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1449745Z   Type 'PrismaService' is missing the following properties from type 'PrismaLike': user, invoice, appointment, queueTicket, and 9 more.
patch-verify	Run typecheck	2026-07-25T22:18:35.1453892Z ##[error]src/staff-chat/staff-chat.service.ts(181,51): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'StaffConversationWhereInput'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1459710Z ##[error]src/staff-chat/staff-chat.service.ts(190,53): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'StaffConversationGetPayload'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1463607Z ##[error]src/staff-chat/staff-chat.service.ts(191,63): error TS7006: Parameter 'participant' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1466537Z ##[error]src/staff-chat/staff-chat.service.ts(196,58): error TS7006: Parameter 'participant' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1469473Z ##[error]src/staff-chat/staff-chat.service.ts(201,50): error TS7006: Parameter 'participant' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1474284Z ##[error]src/staff-chat/staff-chat.service.ts(206,43): error TS2694: Namespace '"/home/runner/work/prij-clinic/prij-clinic/workspace/node_modules/.prisma/client/default".Prisma' has no exported member 'StaffMessageGetPayload'.
patch-verify	Run typecheck	2026-07-25T22:18:35.1477787Z ##[error]src/staff-chat/staff-chat.service.ts(220,25): error TS7006: Parameter 'receipt' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1480272Z ##[error]src/users/users.service.ts(91,23): error TS7006: Parameter 'user' implicitly has an 'any' type.
patch-verify	Run typecheck	2026-07-25T22:18:35.1481731Z 
patch-verify	Run typecheck	2026-07-25T22:18:35.1482006Z > @prij-clinic/web@0.1.0 typecheck
patch-verify	Run typecheck	2026-07-25T22:18:35.1482591Z > tsc --noEmit -p tsconfig.json
patch-verify	Run typecheck	2026-07-25T22:18:35.1482905Z 
patch-verify	Run typecheck	2026-07-25T22:18:50.7686473Z 
patch-verify	Run typecheck	2026-07-25T22:18:50.7687324Z > @prij-clinic/shared@0.1.0 typecheck
patch-verify	Run typecheck	2026-07-25T22:18:50.7688277Z > tsc --noEmit -p tsconfig.json
patch-verify	Run typecheck	2026-07-25T22:18:50.7688854Z 
patch-verify	Run typecheck	2026-07-25T22:18:52.4197670Z ##[error]Process completed with exit code 2.
```
