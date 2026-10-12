// Generated from public/demo (demo photography, Unsplash licence). Replace via the admin.
import type { ImageAsset } from '../types'

const meta = {
  'armchair-amber': [1600, 1067, 'data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAADQAQCdASoQAAsAA4BaJZACdADr7P3QAAD+6y+b7eg0V7t8I9VFBupdG1elkP15ssqjriT9SCkjK3L4a2e461udZBCz/ZxvhGKiccHAgh3SivxINOerTqMd5uAAAA=='],
  'armchair-carved': [1600, 2400, 'data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAACwAwCdASoQABgAPu1iqU2ppaOiMAgBMB2JQAAHhG+3yxPHr8DuAAD+r2/vlraF6sLlnfdOJjtJgAzE3ja8m75QavsNuqokqkmfdlWEVZ+Y+9X8naT35OoOtECVM0PDhb5QyXvW1LFOd369xBuWanL6Xzy4t5GEEIAwIAAA'],
  'armchair-haven': [1600, 2133, 'data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAAAwBACdASoQABUAPu1iqU2ppaQiMAgBMB2JYgCdACBv0g7c8Yeu1jME17AA97F9Mh49PIrZd582632z9B/P8BPfNBFTgvYdPl4sRmWb7eNGr9cohpmHf3VjxigXR1nepohZsu9bhszq+I/zh2ZoN2J88ciZBid25kELxAAA'],
  'armchair-yellow-room': [1600, 1412, 'data:image/webp;base64,UklGRmwAAABXRUJQVlA4IGAAAADQAQCdASoQAA4AA4BaJYgC7ADB9zWsAAD+5u6VtoGliUQtczehKNuCL3t36DSIf6aGV8Tu4XHpIRVF5tZ3DF3/KieOlhe0WjMqwAdu5J3KsnE5KzcMmR18vkzxPgyVcAA='],
  'bed-ivory-classic': [1600, 1912, 'data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAAAQBACdASoQABMAPu1iqU2ppaOiMAgBMB2JZQCAAAitkRMrT9H7LUahqAD+6oJWz+AWhZlmFHLnw1+gtRluwiJLf5b+ktWCKveAmHuV1GLMyUDJkxJC/BNT+E1HuXjl4UC+D+AA'],
  'bed-platform-oak': [1600, 1067, 'data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAADQAQCdASoQAAsAA4BaJQBOgB6QjaHSQAD+CgWXXeu5RTim/cM9NhzOXYPsSBXsat0UZ8PvSU9f8hTfPdlLAAAA'],
  'bed-tufted-regal': [1600, 1068, 'data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAADQAQCdASoQAAsAA4BaJZQAAudsjVObwAD+002QI+8mt85tfnl0CaZEF2mG6oVv+nGDvica5eEAAA=='],
  'bedroom-bench': [1600, 1067, 'data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAAAQAgCdASoQAAsAA4BaJYwCdIExDZ5SVALQAP7XcbcV4RcN0OngcRHiuKE/YN7rkhaoBv71HeS2XdFzcaP0fUEU//Sq62Av3q3ldK2UHAnFaVH00EWhKnX6p6QhJXpbxk+MAAAA'],
  'bedroom-calm': [1600, 900, 'data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAACwAQCdASoQAAkAA4BaJQBOgBk2q8IAAP7YZ19yHqzcFYbbtaVBvbe48jOnWBBUf7X4bt4HVIbYdJ2D7YAptxgzzGh3ftMmnauob0txqMlmBJgrefVIpDKwAAA='],
  'bedroom-ottomans': [1600, 1083, 'data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAAAQAgCdASoQAAsAA4BaJbACdMn8A5Cvf9wAAOJ/rwt+AEhvYtiWFIjsPyObOfc+/5yc+hOq2kic6xAnejLYk5KhQqL67y7Y+/805nzC0dbeptbiMM61+EUNUQanZ5FWATr8AvkJ7zb4WhxgAAA='],
  'cabinet-tall-open': [1600, 2401, 'data:image/webp;base64,UklGRoAAAABXRUJQVlA4IHQAAADwAwCdASoQABgAPu1kqk2ppaQiMAgBMB2JYwCdACHeyniz84Wm4ihAAP7GeZfUUYfzfym66ZDb1SUtW/hfphWb8U0SQe9+zGAwcToVUe+EUjeLUHgFXuiq13hitqycZXdH4uZZsySNTjQSsTmKp9lviWGAAA=='],
  'chair-dining-grey': [1600, 2000, 'data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPu1iqU2ppaQiMAgBMB2JZwC7ABjSsedLNdw3AAD+w/Js02x8w9bg9CywCZHPfKIspyeWU+c3ZFEmT1rgF5OE0mQAAAA='],
  'chair-ivory-tufted': [1600, 2403, 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAABwAwCdASoQABgAPu1iqk2ppaQiMAgBMB2JZwDA3C0AwlpInAAA/u5uI7wUctYZZ1Ec8IfHaZxGeDMW+d+v22jxUfcfrgAA'],
  'chair-ladder-back': [1600, 2400, 'data:image/webp;base64,UklGRnAAAABXRUJQVlA4IGQAAAAQBACdASoQABgAPu1iqU2ppaOiMAgBMB2JQBfnBDv/9dvfevFU94HHAAD+6RyZErWUKAuSzNqK33Ix405kpeWKtYzu2+sBtwUhnFFQsQc75YdSCSG6iAXAUo0xd2iTNyTuXgAA'],
  'console-sheesham': [1600, 1067, 'data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAADwAQCdASoQAAsAA4BaJZQAAudjdA32oAAA/u/JLa3ysWtDZiBKCYix9LsDNHt5GpYBPPrN+UQAAA=='],
  'console-white-mirror': [1600, 2400, 'data:image/webp;base64,UklGRqoAAABXRUJQVlA4IJ4AAABwBACdASoQABgAPu1iqU2ppaOiMAgBMB2JQBibMX1b7buOzbhIf0/6ZRzngAD+yoWG1vkNz7D870wRg4tpCbZKSG2mxjGc1GTgt4Pp7XSwXn/auPBCzZ62h1zkwfhGetAX5lvHXyk/KZv4k4xP7ES4Z0YXvzD4qE2lsHrNdd7vi3WCKLSpWaopE8bCAB38PsWWfimqNHk+cn3U/IAAAA=='],
  'desk-wall-oak': [1600, 2133, 'data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAACwAwCdASoQABUAPu1iqk2ppaQiMAgBMB2JYgCdACHaii7Sij93QAD+1lzJoO2MoAbFKH2epOx9pgvQhmyhyt/IEdjtItWFXQj0CdAFGBUD5SJKZscCvC1Gc/tM6gfeCdLkzB7IywyMF3uzsAAAAA=='],
  'dining-green': [1600, 900, 'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADwAQCdASoQAAkAA4BaJQBWACHw40PRrAAA/usWkS3LTcqVf/158Atx7b5Pv6U2ubwgAUWMN7jHKZ/82AmHfC4vwG07h9vVl2XvXrk7qxPtAAAA'],
  'dining-room-bright': [1600, 2400, 'data:image/webp;base64,UklGRqgAAABXRUJQVlA4IJwAAABQBACdASoQABgAPu1iqU2ppaQiMAgBMB2JQBWAMYYcEPADxrzDWaEHiR4AAP7uDm/UzlXgeyi16AGoQZhUsEFzdGvSe1+oivHVLgSCLUSfmoqZXj3mJR/xZQMLtcfy7+1V/Ou+DhDYeqoVX1nnYRrqHpASTC89+sC2xICjzQdBMqV6HTqXHjk6RcdL69iVtMqP0fU7IwEDeCjtkAA='],
  'dining-round-white': [1600, 2396, 'data:image/webp;base64,UklGRqIAAABXRUJQVlA4IJYAAAAwBACdASoQABgAPu1iqk2ppaQiMAgBMB2JZQC7ACLHuoYPdvHE/+uKZ8AA/lcUYdXOfrNSC2FT1eN6pqHXTDCRVgG5WI5MGfdDq3+Je6JotOdr1fZ6QGPSJNWQ4qa9fzup9rTF+SfVwWbGSC9gHu58GVRISZgiGx8AacX3uLNOQmMgxlyDRqDbXItMaIRAax8NJ/R/AAA='],
  'dining-sheesham-six': [1600, 2133, 'data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAADQAwCdASoQABUAPu1iqU2ppaOiMAgBMB2JZACdAYvCoEoMyoN8TOAA4TnqhotqQqWCb5EDi3fWMuN73HKqgwyKf51ed7YzUHp5UHZWaHzPz3HubJI90szDQ1byVB0QsBD9bhRAL9JYob8cYIUWG8qPb8NO7DehOp3cW9wA'],
  'dining-small': [1600, 2400, 'data:image/webp;base64,UklGRoIAAABXRUJQVlA4IHYAAADwAwCdASoQABgAPu1iqk2ppaQiMAgBMB2JQBdgBDoKbLEv9IA+WvQAAP7EATJYv36cedpZRAQyo+/3JpkIbqlB5aCPqXR48Wp1JjBi+TyXsb4MJk6tmKtzjWmZattpx9P5k9+l88nN5FkN3DEjwnl3jg7WQAAA'],
  'dresser-white-room': [1600, 1068, 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADwAQCdASoQAAsAA4BaJZwAAueMploZZ8gA/uGSJI0rcHIUeU6vJYKwMSbDGjfoOAkkRjuK0cTBi3dn1gcw7DLVgjJTz63y/foAAA=='],
  'hero-living-pendants': [1600, 1600, 'data:image/webp;base64,UklGRmoAAABXRUJQVlA4IF4AAAAQAgCdASoQABAAA4BaJYgCdADGmGPjTLzgAP6FsQQMHsvwMIQ/mvtgGBcvxS4WfU7NKT5TXB4ICK3QuiVz96BZ53AcrpwX3U4I7w2bQTxCzfWhKi/5QG4sFploYAAA'],
  'hero-living-warm': [1600, 844, 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAADwAQCdASoQAAgAA4BaJYgCdADOnd9VewAA/uWnCW0xdVTkl5ePwE8im/+3T8V9suH5QvXiIIq0/hei8HWs7fN4gmZHgU6rjQAAAA=='],
  'living-loft': [1600, 1200, 'data:image/webp;base64,UklGRnoAAABXRUJQVlA4IG4AAACwAgCdASoQAAwAA4BaJbACdEf/i18O23y9Bpf8OQAA/olF6PnOZ46sTpzTnPNw+Jt1hNJOwePvdd+7FDIKlctZiuoJ7UEgi7PQf+LtqQYTrf4xReJznUxb6fe6UeICug8R352xjiULPgk1kfAAAA=='],
  'living-raw-wood-table': [1600, 900, 'data:image/webp;base64,UklGRlQAAABXRUJQVlA4IEgAAAAQAgCdASoQAAkAA4BaJYwC7AELz86BKN6AAP7qkZWvQaHDDSIUNxCHsjFVieF2qVotWtxk/Z9XOLMah/ErbduwB7aZhY9AAAA='],
  'living-round-tables': [1600, 2400, 'data:image/webp;base64,UklGRpIAAABXRUJQVlA4IIYAAAAwBACdASoQABgAPu1iqU2ppaQiMAgBMB2JZQAD5LHk+Jr0kXbl4aacUAAA+gqBx+BMKCNaEhk2cC0+yP2ssROzV5/t49SDW/GlWn2zlZpMptGdMXLO2oIYANFlcjgj+mpnCwmP/8nKdSjHfprmd52ZmkiEekgwZmI4ulbG0kEm7fiiQjAAAA=='],
  'living-terracotta': [1600, 1600, 'data:image/webp;base64,UklGRm4AAABXRUJQVlA4IGIAAAAQAgCdASoQABAAA4BaJYgCdADz6vffOjvgAPcmtfQJNc6w88vQXp7p1C1z3R7fUSN9juZq2jr1xjvGlnKSvzbOAlbGJ9mN++3ObYtNIDZm108hyQ1Z2hkeEOEROyJrQHUAAA=='],
  'loveseat-grey-channel': [1600, 1067, 'data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADwAQCdASoQAAsAA4BaJaQAApOpdbI93gAA/pqjg27gdaWve/Vp3XXZHvFbRhaqM3/zbJyPag4Qm0sk/L6yFvdCQAA='],
  'room-warm-orange-chair': [1600, 2844, 'data:image/webp;base64,UklGRpAAAABXRUJQVlA4IIQAAACwAwCdASoQABwAPu1iqk2ppaQiMAgBMB2JQBOgMXsWkbu9HN2bAAD+9TC5WDgIVVn0cfJDNA1ahYUJVnoxjvNF+8W1+gZLp2jdYh4/1VZt1G/MmQJ2HJqGF8aS09kRqneHLwhKZ+vfeZFzGCzAuV+psWEcjuxTjDIe04sYOR4IsMWAAAA='],
  'side-table-cove': [1600, 1067, 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAADwAQCdASoQAAsAA4BaJYwC7ADdHGNWsSAA/u/XlF6KHnnGWnxdD/2W/er54mh6nkVd1SdLG14jJcNTmgAAAA=='],
  'sideboard-rattan': [1600, 2844, 'data:image/webp;base64,UklGRpoAAABXRUJQVlA4II4AAABwBACdASoQABwAPu1kqk4ppaQiMAgBMB2JQBOmUABp0yoTPSdZzIqnlOOIAAD+4vQpyOYVfunMLR24m9Da8ww2+djtWgjXX7CEmdFeafvoY2zZMylUe3k5OcDA+Tp3TupBAXZUa+7tFZLKIbwtkjKGSNbl4cgHJKChKe0Q/N+IrdLjpDAL1r85vb1GwAAA'],
  'sofa-cognac-room': [1600, 1067, 'data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAADwAQCdASoQAAsAA4BaJYwC7AEKa9Tpd0AA/taMU4cG5nhr9XZIaLF8El4zhot8qQpUeXiJ8ValC8vM5R4NR9u5l6BZhU0R8U0eKgPJFIl4ugAA'],
  'sofa-emerald-velvet': [1600, 1067, 'data:image/webp;base64,UklGRlAAAABXRUJQVlA4IEQAAAAwAgCdASoQAAsAA4BaJYgC7AEPh29y7bEVwAD+7U/DAJ6aPM7mYuJ5pwObLhMAi7MIQvtkCBYyZLJGgVpsCoedzW/AAA=='],
  'sofa-ivory-cloud': [1600, 1055, 'data:image/webp;base64,UklGRkgAAABXRUJQVlA4IDwAAADQAQCdASoQAAsAA4BaJQBOgCKQ3s0H0AD+4iLCk4CGJMpF1PWPLdk2Q1NAbsNaspeVhrou8aku0dbbAAA='],
  'sofa-tan-leather': [1600, 1067, 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAAAQAgCdASoQAAsAA4BaJQBOj+ADAb/YvpvwAP7xzy/X3C6nWUi/d1XYq464fJWS53mAHronor8YG5IvEYp/qgg90HfXgmXRf44AAA=='],
  'sofa-terracotta': [1600, 1600, 'data:image/webp;base64,UklGRngAAABXRUJQVlA4IGwAAAAQAgCdASoQABAAA4BaJbACdAD7KfTqg2gYAPcrPLmJJ/kFpTB8aFchbhDlqa62sa0fH3HZVGJM5cHGzLXnIZb7yUVXgHLJtlaNQlqX4RGXBOyNjSUIseg3KRXjKx8cEAD07Kpl2XKLWCUUAAA='],
  'stool-black-bar': [1600, 2000, 'data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAACwAwCdASoQABQAPu1iqU2ppaOiMAgBMB2JaQAAW+vI7lr2EKYWgAD+3lbHgr8iHFjO45ksYi1cLVKkc4BuDXovprJ6V089pxw2AAAA'],
  'stool-oak-counter': [1600, 2399, 'data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAAAwAwCdASoQABgAPu1iqk4ppaQiMAgBMB2JQBOmUACMP3jAAP7hnKlcN+30hS1DNAQICPC8W2BZX41IVVonNFLPSuokvQWtnAAAAA=='],
  'stools-kitchen': [1600, 1067, 'data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAAAwAgCdASoQAAsAA4BaJbACdAEDfR+khbAAMAD+3/UuKMyyD/HVp0d/puSTPlc5L44ekT6S10SRf5zEL7V9ufDg+5eftYrFS1DgAAAA'],
  'tv-unit-floating': [1600, 1067, 'data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAACwAQCdASoQAAsAA4BaJbACdADzi9hAAP7WGU5OpjinDv3SiHFYt16M6FbwrBWx37Ay1pt0977JUrUJQBiz7UhlBlwqLcJS8UVDRuxYsd2y1FvVNXuYAA=='],
} as const

export type DemoImageName = keyof typeof meta

export function demoImage(name: DemoImageName, alt: string): ImageAsset {
  const [w, h, blur] = meta[name]
  return { ref: `/demo/${name}.webp`, alt, w, h, blur }
}
