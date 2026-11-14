from domain.base import Model


class Say(Model):
    text: str
    emotion: str
    target_id: int | None = None


class Hug(Model):
    target_id: int


class Kiss(Model):
    target_id: int


class Move(Model):
    destination_id: int


class Confess(Model):
    text: str


class Wait(Model):
    pass


Action = Say | Hug | Kiss | Move | Confess | Wait


def action_kind(action: type[Model]) -> str:
    return action.__name__.lower()
