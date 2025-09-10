#!/usr/bin/env python3
from fpdf import FPDF

# Criar PDF simples
pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=12)

# Conteúdo do extrato
conteudo = [
    "EXTRATO BANCARIO",
    "Conta: 12345-6",
    "Agencia: 0001",
    "Periodo: 01/09/2023 a 10/09/2023",
    "",
    "Data        Descricao                           Valor",
    "01/09/2023  SALDO ANTERIOR                      R$ 1.000,00",
    "02/09/2023  TRANSFERENCIA PIX RECEBIDA         R$ 250,50", 
    "03/09/2023  PAGAMENTO DE CONTA LUZ             R$ -150,30",
    "05/09/2023  TED ENVIADO                        R$ -500,00",
    "07/09/2023  DEPOSITO EM ESPECIE                R$ 300,00",
    "10/09/2023  TAXA BANCARIA                      R$ -19,90",
    "",
    "SALDO ATUAL: R$ 880,30"
]

for linha in conteudo:
    pdf.cell(0, 10, linha, 0, 1)

pdf.output("extrato_teste.pdf")
print("PDF criado com sucesso!")
