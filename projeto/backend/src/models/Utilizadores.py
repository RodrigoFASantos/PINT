from django.db import models

class Cargo(models.Model):
    id_cargo = models.AutoField(primary_key=True)
    descricao = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.descricao

class Utilizador(models.Model):
    id_utilizador = models.AutoField(primary_key=True)
    id_cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE)
    nome = models.CharField(max_length=150)
    idade = models.IntegerField()
    email = models.EmailField(unique=True)
    telefone = models.CharField(max_length=15, unique=True)

    def __str__(self):
        return self.nome
