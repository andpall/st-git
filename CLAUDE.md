# st-git: правила кода

## Без комментариев
- Никаких комментариев в коде: ни `//`, ни `/* */`, ни JSDoc.
- Если без комментария непонятно, переименуйте переменную или функцию либо вынесите кусок в функцию с говорящим именем.

## Маленькие файлы
- Не больше 200 строк в файле.
- Подходит к лимиту, значит пора делить по смыслу на несколько файлов в той же папке.

## Без цепочек вызовов
- Не больше одного вызова метода подряд: никаких `a.split().filter().map()`.
- Промежуточный результат кладите в переменную с понятным именем.
- В `map`, `filter`, `forEach` и т.д. передавайте именованную функцию, а не инлайн-лямбду.

## async/await вместо then
- Никаких `.then()` и `.catch()` у промисов: только `async`/`await` и `try`/`catch`.

```ts
// плохо
await repoGit(['merge-base', '--is-ancestor', newest, 'HEAD'])
  .catch(() => { throw new Error('Squash works only on commits of the current branch.'); });

// хорошо
try {
  await repoGit(['merge-base', '--is-ancestor', newest, 'HEAD']);
} catch {
  throw new Error('Squash works only on commits of the current branch.');
}
```

```ts
// плохо
const commits = out.split('\n').filter(Boolean).map(line => { /* ... */ });

// хорошо
const lines = out.split('\n');
const nonEmpty = lines.filter(Boolean);
const commits = nonEmpty.map(parseCommitLine);
```

## Структура
```
src/
  extension.ts   точка входа, регистрация команд
  guarded.ts     обёртка команд: ловит ошибку, обновляет панели, показывает конфликты
  askpassMain.ts скрипт, который git вызывает вместо терминала, чтобы спросить логин/пароль
  refresh.ts     обновление всех панелей и слежение за .git и файлами
  api/           общий доступ к git CLI, содержимому версий файлов (gitContent) и ввод логина/пароля для git (askpass)
  ui/            общие диалоги VS Code
  commands/      команды над историей: по файлу на команду
  utils/         общие чистые функции без vscode и git: парсеры вывода git, дерево файлов
  modules/       фичи: всё по фиче в одной папке (UI, чтение из git, чистые функции, tests/)
    branches/    окно веток: checkout, новая ветка, Smart Checkout, ветка в статус-баре
    commit/      Local Changes (файлы с галочками) и Commit (сообщение, Amend, кнопка Commit)
    log/         панель Log: provider, readLog (фильтры, подгрузка), graph, история файла
    blame/       Annotate with Git Blame в редакторе
    changes/     панель Changes: дерево файлов коммита, diff
    conflicts/   панель Conflicts: конфликты при rebase/merge/cherry-pick/revert/stash, accept/merge
    stash/       панель Stashes: список, файлы, apply/pop/drop
    rebase/      Interactively Rebase from Here: окно со списком коммитов и действиями
    push/        окно Push: куда пушить, список коммитов, теги, force push
    tags/        теги из Log: создать, запушить, удалить
webview/         JS/CSS для webview (log/ разбит на файлы, общие переменные в state.js)
resources/       иконки
scripts/         dev-скрипты (playground.sh создаёт тестовый репозиторий .playground)
```
- Код, нужный только одной фиче, лежит в её модуле. В `api/`, `ui/` и `commands/` попадает только общее.
- Тесты лежат в подпапке `tests/` рядом с кодом: `src/modules/log/tests/graph.test.ts`.
- `npm test` собирает проект и запускает все `*.test.js`.
