import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import Swal from 'sweetalert2';
import { PedidoService } from '../services/pedido.service';
import { Item, FormaPagamento, PedidoContem, Pedido, Pagamento } from '../shared/model.module';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.component.html',
  styleUrls: ['./pedido.component.css']
})
export class PedidoComponent implements OnInit {

  @ViewChild('stepper') private myStepper: MatStepper; // stepper

  itensPedido: PedidoContem[] = new Array;
  vlTotal: number = 0;

  formaPagamento: FormaPagamento[] = new Array;
  pagamentoUsuario: Pagamento = new Pagamento;

  pedidoUsuario: Pedido = new Pedido;
  pedidoFormGroup: FormGroup;

  itensCardapio = {
    "hamburgueres": [],
    "acompanhamentos": [],
    "bebidas": [],
    "sobremesas": []
  }

  constructor(private cookieService: CookieService, private router: Router, private formBuilder: FormBuilder, private pedidoService: PedidoService) { }

  ngOnInit(): void {

    if (!this.checkUserLogged()) {
      this.router.navigateByUrl('/');
    }

    this.pedidoService.fetchCardapio(1).subscribe((data) => {
      this.itensCardapio.hamburgueres = this.itensCardapio.hamburgueres.concat(data);
    })

    this.pedidoService.fetchCardapio(2).subscribe((data) => {
      this.itensCardapio.acompanhamentos = this.itensCardapio.acompanhamentos.concat(data);
    })

    this.pedidoService.fetchCardapio(3).subscribe((data) => {
      this.itensCardapio.bebidas = this.itensCardapio.bebidas.concat(data);
    })

    this.pedidoService.fetchCardapio(4).subscribe((data) => {
      this.itensCardapio.sobremesas = this.itensCardapio.sobremesas.concat(data);
    })

    this.pedidoService.fetchPagamento().subscribe((data) => {
      this.formaPagamento = this.formaPagamento.concat(data);
    })

    this.pedidoFormGroup = this.formBuilder.group({
      forma: ['', [Validators.required]]
    })
  }

  addItem(item: Item) {
    var exists = false;

    this.itensPedido.map(element => {
       if (element.itemCdItem == item.cdItem) {
         exists = true;
         element.quantidade++;
       }
    });

    if (!exists) {
    this.itensPedido.push(new PedidoContem(item.cdItem))
    }
    this.vlTotal += item.preco;

    console.log(this.itensPedido);
  }

  removeItem(item: Item) {
    var exists = false;

    this.itensPedido.map(element => {
      if (element.itemCdItem == item.cdItem && element.quantidade > 1) {
        exists = true;
        element.quantidade--; 
      }
   });

   this.itensPedido.forEach(element => {
    if (element.itemCdItem == item.cdItem) {
      this.vlTotal -= item.preco;
    }})

   if (!exists) {
    this.itensPedido = this.itensPedido.filter(element => element.itemCdItem !== item.cdItem);
   }

    console.log(this.itensPedido);
  }

  finalizarPedido() {

    this.pedidoFormGroup.get('forma').disable();
    
    Swal.fire({
      title: 'Deseja confirmar este pedido?',
      html: `<p>Total: R$ ${this.vlTotal.toFixed(2)} </p>` 
      +`<p>Pagamento: <i>${this.pedidoFormGroup.getRawValue().forma.descricao}</i></p>`,
      showDenyButton: true,
      confirmButtonText: `Confirmar`,
      confirmButtonColor: '#000000',
      denyButtonText: `Cancelar`,
    }).then((result) => {
      if (result.isDenied) {
        this.pedidoFormGroup.get('forma').enable();
      } else if (result.isConfirmed) {

        this.pagamentoUsuario = {
          vlTotal: this.vlTotal,
          formaPagamento: this.pedidoFormGroup.getRawValue().forma
        }
    
        this.pedidoUsuario = {
          pedidos: this.itensPedido,
          pagamento: this.pagamentoUsuario
         // enderecoEntrega: this.pedidoFormGroup.getRawValue().endereco
        } 
    
        this.pedidoService.realizarPedido(this.pedidoUsuario).subscribe((data) => {
          this.pedidoUsuario.cdPedido = data.orderData.cdPedido;
          this.myStepper.next();
        }, (err) => {
          Swal.fire({ title:'Erro!', html:"<p>Ocorreu algo de errado na conexão com o servidor.</p>"+
          "<p>Tente novamente mais tarde</p>", icon: 'error',  confirmButtonColor: '#000000'})
          this.pedidoFormGroup.get('forma').enable();
        }) 
    

      }
    })

  }

  checkUserLogged(): boolean {
    return this.cookieService.check('SessionCookie');
  }
  

}
